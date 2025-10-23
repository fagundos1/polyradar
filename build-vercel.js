#!/usr/bin/env node
import { mkdir, cp, writeFile, readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildForVercel() {
  console.log('Building for Vercel deployment...');
  
  const outputDir = join(__dirname, '.vercel', 'output');
  const functionsDir = join(outputDir, 'functions');
  const staticDir = join(outputDir, 'static');
  const apiSourceDir = join(__dirname, 'api');
  
  // Create output directories
  await mkdir(functionsDir, { recursive: true });
  await mkdir(staticDir, { recursive: true });
  
  console.log('✓ Created output directories');
  
  // Copy static files from dist to .vercel/output/static
  const distDir = join(__dirname, 'dist');
  if (existsSync(distDir)) {
    await cp(distDir, staticDir, { recursive: true, force: true });
    console.log('✓ Copied static files from dist/ to .vercel/output/static/');
  }
  
  // Read package.json from api directory
  const apiPackageJsonPath = join(apiSourceDir, 'package.json');
  let apiPackageJson = null;
  if (existsSync(apiPackageJsonPath)) {
    const content = await readFile(apiPackageJsonPath, 'utf-8');
    apiPackageJson = JSON.parse(content);
  }
  
  // Process API functions
  const apiFiles = await readdir(apiSourceDir);
  
  for (const file of apiFiles) {
    if (file === 'package.json' || file === 'pnpm-lock.yaml' || file === 'node_modules') {
      continue;
    }
    
    const filePath = join(apiSourceDir, file);
    const stat = await import('fs').then(fs => fs.promises.stat(filePath));
    
    if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
      // Create .func directory for each API file
      const funcName = file.replace(/\.(js|ts)$/, '');
      const funcDir = join(functionsDir, 'api', `${funcName}.func`);
      
      await mkdir(funcDir, { recursive: true });
      
      // Copy the function file as index.js
      await cp(filePath, join(funcDir, 'index.js'), { force: true });
      
      // Copy package.json if it exists
      if (apiPackageJson) {
        await writeFile(
          join(funcDir, 'package.json'),
          JSON.stringify(apiPackageJson, null, 2)
        );
      }
      
      // Create .vc-config.json
      const vcConfig = {
        runtime: 'nodejs22.x',
        handler: 'index.js',
        launcherType: 'Nodejs',
        shouldAddHelpers: true
      };
      
      await writeFile(
        join(funcDir, '.vc-config.json'),
        JSON.stringify(vcConfig, null, 2)
      );
      
      console.log(`✓ Created function: api/${funcName}`);
    } else if (stat.isDirectory() && file === 'webhooks') {
      // Handle webhooks directory
      await processWebhooksDirectory(apiSourceDir, functionsDir, apiPackageJson);
    }
  }
  
  // Update config.json
  const config = {
    version: 3,
    routes: [
      {
        handle: 'filesystem'
      },
      {
        src: '/(.*)',
        dest: '/index.html'
      }
    ]
  };
  
  await writeFile(
    join(outputDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log('✓ Updated config.json');
  console.log('\n✅ Build complete! Ready for Vercel deployment.');
}

async function processWebhooksDirectory(apiSourceDir, functionsDir, apiPackageJson) {
  const webhooksDir = join(apiSourceDir, 'webhooks');
  
  async function processDir(dir, basePath = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = basePath ? join(basePath, entry.name) : entry.name;
      
      if (entry.isDirectory()) {
        await processDir(fullPath, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        // Convert [model] to model for the function directory
        const funcPath = relativePath
          .replace(/\.(js|ts)$/, '')
          .replace(/\[([^\]]+)\]/g, '$1');
        
        const funcDir = join(functionsDir, 'api', 'webhooks', `${funcPath}.func`);
        
        await mkdir(funcDir, { recursive: true });
        
        // Copy the function file
        await cp(fullPath, join(funcDir, 'index.js'), { force: true });
        
        // Copy package.json if it exists
        if (apiPackageJson) {
          await writeFile(
            join(funcDir, 'package.json'),
            JSON.stringify(apiPackageJson, null, 2)
          );
        }
        
        // Create .vc-config.json
        const vcConfig = {
          runtime: 'nodejs22.x',
          handler: 'index.js',
          launcherType: 'Nodejs',
          shouldAddHelpers: true
        };
        
        await writeFile(
          join(funcDir, '.vc-config.json'),
          JSON.stringify(vcConfig, null, 2)
        );
        
        console.log(`✓ Created webhook function: api/webhooks/${funcPath}`);
      }
    }
  }
  
  await processDir(webhooksDir);
}

buildForVercel().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

