const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
require("dotenv").config();
const fetch = require('node-fetch');
const PROXY_URL = 'https://project-readme-gen.vercel.app/api/generate';

const callProxyApi = async (prompt) => {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error calling proxy API:', error);
    throw error;
  }
};

const analyzeProject = (projectPath) => {
  const files = glob.sync(`${projectPath}/**/*`, {
    nodir: true,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });
  const analysis = files.map((file) => {
    const content = fs.readFileSync(file, "utf-8");
    return { file, content: content.slice(0, 500) };
  });
  return analysis;
};

const generateReadme = async (projectAnalysis) => {
  const readmeSections = await Promise.all(
    projectAnalysis.map(async ({ file, content }) => {
      const seoFriendlyPrompt = `
File: ${file}
Content (truncated):
${content}

Generate a detailed, SEO-friendly section for a GitHub README that includes:
1. Clear descriptive headings using markdown (##)
2. A brief but compelling project description
3. Key features in bullet points
4. Technologies/dependencies used
5. Installation and usage instructions (if applicable)
6. Code examples (if relevant)
7. Include relevant keywords naturally
8. Add badges where appropriate (build status, version, license)

Format the output in markdown and ensure it's scannable and well-structured.`;

      try {
        const content = await callProxyApi(seoFriendlyPrompt);
        return content;
      } catch (error) {
        console.error(`Error generating content for ${file}:`, error);
        return "";
      }
    })
  );
  return readmeSections.filter((section) => section).join("\n\n");
};

const writeReadme = (projectPath, content) => {
  const readmePath = path.join(projectPath, "README.md");
  fs.writeFileSync(readmePath, content, "utf-8");
  console.log(`README generated at ${readmePath}`);
};

module.exports = async (projectPath) => {
  const analysis = analyzeProject(projectPath);
  const readmeContent = await generateReadme(analysis);
  writeReadme(projectPath, readmeContent);
};