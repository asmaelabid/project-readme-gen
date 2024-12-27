const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { Configuration, OpenAI } = require('openai');
require('dotenv').config();


if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeProject = (projectPath) => {
    const files = glob.sync(`${projectPath}/**/*`, { nodir: true });
    const analysis = files.map((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        return { file, content: content.slice(0, 500) }; // Limit content for brevity
    });
    return analysis;
};

const generateReadme = async (projectAnalysis) => {
    const prompts = projectAnalysis.map(({ file, content }) => 
        `File: ${file}\nContent (truncated):\n${content}\nGenerate a description:`
    );
    const responses = await Promise.all(prompts.map(async (prompt) => {
        const response = await openai.completions.create({
            model: 'gpt-3.5-turbo-instruct',
            prompt,
            max_tokens: 150,
        });
        return response.data.choices[0].text.trim();
    }));
    return responses.join('\n\n');
};

const writeReadme = (projectPath, content) => {
    const readmePath = path.join(projectPath, 'README.md');
    fs.writeFileSync(readmePath, content, 'utf-8');
    console.log(`README generated at ${readmePath}`);
};

module.exports = async (projectPath) => {
    const analysis = analyzeProject(projectPath);
    const readmeContent = await generateReadme(analysis);
    writeReadme(projectPath, readmeContent);
};
