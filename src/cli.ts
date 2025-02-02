import chalk from "chalk";
import clear from "clear";
import path from "path";
import commander from "commander";
import { cleanupSync } from "temp";
import { Options, SAO } from "sao";
import prompts from "prompts";

import { get_source } from "@Helper";
import packageData from "../package.json";

const generator = path.resolve(__dirname, "./");
const templateDir = (projectType: string) =>
    path.resolve(__dirname, "../templates", projectType);

const cli = async (): Promise<void> => {
    clear();
    const program = commander
        .name(packageData.name)
        .version(packageData.version)
        .arguments("<project-directory>")
        .usage(`${chalk.green("<project-directory>")} [options]`)
        .description(packageData.description)
        .option(
            "-s, --source <source-path>",
            "specify a custom source of plugins",
        )
        .option("-d, --debug", "print additional logs and skip install script")
        .on("--help", () => {
            console.log();
            console.log(
                `  Only ${chalk.green("<project-directory>")} is required.`,
            );
            console.log();
            console.log(
                `  Provide a ${chalk.green
                    .bold`<project-directory>`} and you will be prompted to proceed.`,
            );
            console.log();
            console.log(
                `  If you want to use custom plugins. You need to provide a source.`,
            );
            console.log();
            console.log(`  A custom source can be one of:`);
            console.log(
                `  - a remote git repo: ${chalk.green(
                    "https://github.com/my-plugin-source.git",
                )}`,
            );
            console.log(
                `  - a local path relative to the current working directory: ${chalk.green(
                    "../my-source",
                )}`,
            );
            console.log();
        })
        .parse(process.argv);

    /**
     * Check for project-directory defined
     */
    const [projectDir] = program.args;

    if (projectDir === undefined) {
        console.error("Please specify the project directory:");
        console.log(
            `  ${chalk.cyan(program.name())} ${chalk.green(
                "<project-directory>",
            )}`,
        );
        console.log();
        console.log(
            `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`,
        );
        process.exit(1);
    }

    const { projectType } = await prompts({
        type: "select",
        name: "projectType",
        message: "Select your project type",
        choices: [
            { title: "React", value: "react" },
            { title: "Next.js", value: "nextjs" },
        ],
    });

    /**
     * get source path
     */
    const { path: sourcePath, error: sourceError } = await get_source(
        program.source || projectType,
    );

    if (sourceError) {
        console.error(`${chalk.bold`${sourceError}`}`);
        console.log("Source can be a remote git repository or a local path.");
        console.log();
        console.log("You provided:");
        console.log(`${chalk.blueBright(program.source)}`);
        console.log();
        console.log(
            `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`,
        );
        cleanupSync();
        process.exit(1);
    }

    const sao = new SAO({
        generator,
        outDir: projectDir,
        logLevel: program.debug ? 4 : 1,
        appName: projectDir,
        extras: {
            debug: !!program.debug,
            paths: {
                templateDir: templateDir(projectType),
                sourcePath,
            },
            projectType,
        },
    } as Options);

    await sao.run().catch((err) => {
        console.log(`${program.name()} has encountered an error.`);
        console.log();
        console.log(`If you think this is caused by a bug. Please check out:`);
        console.log(`${chalk.blueBright(packageData.bugs.url)}`);
        console.log();
        console.error("ERROR", err);
        process.exit(1);
    });

    cleanupSync();
};

export default cli;
