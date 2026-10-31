import * as fs from "fs";
import * as path from "path";
import {
	IndentationText,
	type MethodSignature,
	Project,
	type SourceFile,
	SyntaxKind,
} from "ts-morph";

function addIsolatedContextParameter(typesSourceFile: SourceFile, interfaceName: string, methodNames: string[]): void {
	const targetInterface = typesSourceFile.getInterface(interfaceName);
	if (!targetInterface) return;
	const evaluateSignatures = targetInterface
		.getMembers()
		.filter(
			(member): member is MethodSignature =>
				member.isKind(SyntaxKind.MethodSignature) && methodNames.includes(member.getName()),
		);

	evaluateSignatures.forEach(method => {
		if (!method.getParameter("isolatedContext")) {
			method.addParameter({
				name: "isolatedContext",
				type: "boolean",
				hasQuestionToken: true,
			});
		}
	});
}

function patchTypesDeclarations(): void {
	const project = new Project({
		manipulationSettings: {
			indentationText: IndentationText.TwoSpaces,
		},
	});

	const possiblePaths = [
		"packages/playwright-core/types/types.d.ts",
		"packages/patchwrite-core/types/types.d.ts",
		"packages/patchright-core/types/types.d.ts",
	];

	const targetPath = possiblePaths.find(p => fs.existsSync(p));
	if (!targetPath) {
		console.warn("Could not find types.d.ts in standard package paths");
		return;
	}

	const typesSourceFile = project.addSourceFileAtPath(targetPath);
	addIsolatedContextParameter(typesSourceFile, "Page", ["evaluate", "evaluateHandle"]);
	addIsolatedContextParameter(typesSourceFile, "Worker", ["evaluate", "evaluateHandle"]);
	addIsolatedContextParameter(typesSourceFile, "Frame", ["evaluate", "evaluateHandle", "evaluateAll"]);
	addIsolatedContextParameter(typesSourceFile, "Locator", ["evaluate", "evaluateHandle"]);
	addIsolatedContextParameter(typesSourceFile, "JSHandle", ["evaluate", "evaluateHandle"]);

	project.saveSync();
}

function getAllJsTsFiles(dir: string): string[] {
	let results: string[] = [];
	if (!fs.existsSync(dir)) return results;
	const list = fs.readdirSync(dir);

	list.forEach((file: string) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat && stat.isDirectory()) {
			results = results.concat(getAllJsTsFiles(filePath));
		} else if (filePath.endsWith(".ts") || filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
			results.push(filePath);
		}
	});

	return results;
}

function renameImportsAndExportsInDirectory(directoryPath: string): void {
	if (!fs.existsSync(directoryPath)) return;
	const project = new Project();
	const jsTsFiles = getAllJsTsFiles(directoryPath);

	jsTsFiles.forEach(filePath => {
		const sourceFile = project.addSourceFileAtPath(filePath);
		let modified = false;

		sourceFile.getImportDeclarations().forEach(importDecl => {
			const moduleSpecifierValue = importDecl.getModuleSpecifierValue();

			if (moduleSpecifierValue.startsWith("playwright-core") || moduleSpecifierValue.startsWith("patchright-core")) {
				const newModuleSpecifier = moduleSpecifierValue
					.replace("playwright-core", "patchwrite-core")
					.replace("patchright-core", "patchwrite-core");
				importDecl.setModuleSpecifier(newModuleSpecifier);
				modified = true;
			} else if (moduleSpecifierValue.includes("playwright-core") || moduleSpecifierValue.includes("patchright-core")) {
				const newModuleSpecifier = moduleSpecifierValue
					.replace(/playwright-core/g, "patchwrite-core")
					.replace(/patchright-core/g, "patchwrite-core");
				importDecl.setModuleSpecifier(newModuleSpecifier);
				modified = true;
			} else if (moduleSpecifierValue === "playwright" || moduleSpecifierValue === "patchright") {
				importDecl.setModuleSpecifier("patchwrite");
				modified = true;
			}
		});

		sourceFile.getExportDeclarations().forEach(exportDecl => {
			const moduleSpecifierValue = exportDecl.getModuleSpecifierValue();

			if (moduleSpecifierValue && (moduleSpecifierValue.startsWith("playwright-core") || moduleSpecifierValue.startsWith("patchright-core"))) {
				const newModuleSpecifier = moduleSpecifierValue
					.replace("playwright-core", "patchwrite-core")
					.replace("patchright-core", "patchwrite-core");
				exportDecl.setModuleSpecifier(newModuleSpecifier);
				modified = true;
			} else if (moduleSpecifierValue === "playwright" || moduleSpecifierValue === "patchright") {
				exportDecl.setModuleSpecifier("patchwrite");
				modified = true;
			}
		});

		const moduleLoaderCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter(call => {
			const expression = call.getExpression();
			return (
				expression.getText() === "require" ||
				expression.getText() === "require.resolve" ||
				expression.isKind(SyntaxKind.ImportKeyword)
			);
		});

		moduleLoaderCalls.forEach(call => {
			const args = call.getArguments();

			if (args.length) {
				const argText = args[0].getText();
				if (argText.includes("playwright-core") || argText.includes("patchright-core")) {
					args[0].replaceWithText(
						argText
							.replace(/playwright-core/g, "patchwrite-core")
							.replace(/patchright-core/g, "patchwrite-core"),
					);
					modified = true;
				} else if (argText.includes("playwright") || argText.includes("patchright")) {
					args[0].replaceWithText(
						argText
							.replace(/playwright/g, "patchwrite")
							.replace(/patchright/g, "patchwrite"),
					);
					modified = true;
				}
			}
		});

		if (modified) {
			sourceFile.saveSync();
			console.log(`Modified imports/exports in: ${filePath}`);
		}
	});
}

export function patchRebranding(): void {
	console.log("Applying type declaration patches...");
	patchTypesDeclarations();

	// Rename packages/playwright-core -> packages/patchwrite-core
	if (fs.existsSync("packages/playwright-core") && !fs.existsSync("packages/patchwrite-core")) {
		fs.renameSync("packages/playwright-core", "packages/patchwrite-core");
		console.log("Renamed packages/playwright-core -> packages/patchwrite-core");
	} else if (fs.existsSync("packages/patchright-core") && !fs.existsSync("packages/patchwrite-core")) {
		fs.renameSync("packages/patchright-core", "packages/patchwrite-core");
		console.log("Renamed packages/patchright-core -> packages/patchwrite-core");
	}

	// Rename packages/playwright -> packages/patchwrite
	if (fs.existsSync("packages/playwright") && !fs.existsSync("packages/patchwrite")) {
		fs.renameSync("packages/playwright", "packages/patchwrite");
		console.log("Renamed packages/playwright -> packages/patchwrite");
	} else if (fs.existsSync("packages/patchright") && !fs.existsSync("packages/patchwrite")) {
		fs.renameSync("packages/patchright", "packages/patchwrite");
		console.log("Renamed packages/patchright -> packages/patchwrite");
	}

	// Copy README.md
	if (fs.existsSync("../README.md")) {
		const readmeData = fs.readFileSync("../README.md", "utf8");
		fs.writeFileSync("packages/patchwrite/README.md", readmeData, "utf8");
	}

	// Write patchwrite-core README.md
	fs.writeFileSync(
		"packages/patchwrite-core/README.md",
		"# patchwrite-core\n\nThis package contains the no-browser flavor of [Patchwrite](https://github.com/codeiva11/patchright).\n",
		"utf8",
	);

	const releaseVersion = process.env.patchwrite_release || process.env.patchright_release;

	// Update packages/patchwrite-core/package.json
	if (fs.existsSync("packages/patchwrite-core/package.json")) {
		const corePkgJson = JSON.parse(fs.readFileSync("packages/patchwrite-core/package.json", "utf8"));
		corePkgJson.name = "patchwrite-core";
		if (releaseVersion && releaseVersion.trim() !== "") {
			corePkgJson.version = releaseVersion.replace(/^v/, "");
		}
		corePkgJson.author = { name: "Microsoft Corporation, patched by codeiva11" };
		corePkgJson.homepage = "https://github.com/codeiva11/patchright";
		corePkgJson.repository = {
			type: "git",
			url: "https://github.com/codeiva11/patchright",
		};
		corePkgJson.bin = {
			"patchwrite-core": "cli.js",
		};
		fs.writeFileSync("packages/patchwrite-core/package.json", JSON.stringify(corePkgJson, null, 4), "utf8");
		console.log("Updated packages/patchwrite-core/package.json");
	}

	// Update packages/patchwrite/package.json
	if (fs.existsSync("packages/patchwrite/package.json")) {
		const pkgJson = JSON.parse(fs.readFileSync("packages/patchwrite/package.json", "utf8"));
		pkgJson.name = "patchwrite";
		if (releaseVersion && releaseVersion.trim() !== "") {
			pkgJson.version = releaseVersion.replace(/^v/, "");
		}
		pkgJson.author = { name: "Microsoft Corporation, patched by codeiva11" };
		pkgJson.homepage = "https://github.com/codeiva11/patchright";
		pkgJson.repository = {
			type: "git",
			url: "https://github.com/codeiva11/patchright",
		};
		pkgJson.bin = {
			patchwrite: "cli.js",
		};
		pkgJson.dependencies = pkgJson.dependencies || {};
		pkgJson.dependencies["patchwrite-core"] = pkgJson.version;
		if (pkgJson.dependencies["patchright-core"]) {
			delete pkgJson.dependencies["patchright-core"];
		}
		if (pkgJson.dependencies["playwright-core"]) {
			delete pkgJson.dependencies["playwright-core"];
		}
		fs.writeFileSync("packages/patchwrite/package.json", JSON.stringify(pkgJson, null, 4), "utf8");
		console.log("Updated packages/patchwrite/package.json");
	}

	// Update imports and exports in packages/patchwrite
	console.log("Rewriting imports/exports in packages/patchwrite...");
	renameImportsAndExportsInDirectory("packages/patchwrite");
	console.log("✅ Rebranding to Patchwrite completed successfully.");
}

patchRebranding();
