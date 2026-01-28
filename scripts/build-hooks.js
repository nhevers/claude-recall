#!/usr/bin/env node

/**
 * Build script for claude-recall hooks
 * Bundles TypeScript hooks into individual standalone executables using esbuild
 */

import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENGINE_SERVICE = {
  name: 'worker-service',
  source: 'src/core/engine-service.ts'
};

const SEARCH_SERVER = {
  name: 'search-server',
  source: 'src/servers/mcp-server.ts'
};

const BUILDER_GENERATOR = {
  name: 'builder-runtime',
  source: 'src/core/builder-generator.ts'
};

async function buildHooks() {
  console.log('🔨 Building claude-recall hooks and worker service...\n');

  try {
    // Read version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const version = packageJson.version;
    console.log(`📌 Version: ${version}`);

    // Create output directories
    console.log('\n📦 Preparing output directories...');
    const hooksDir = 'plugin/scripts';
    const uiDir = 'plugin/ui';

    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    if (!fs.existsSync(uiDir)) {
      fs.mkdirSync(uiDir, { recursive: true });
    }
    console.log('✓ Output directories ready');

    // Generate plugin/package.json for cache directory dependency installation
    // Note: bun:sqlite is a Bun built-in, no external dependencies needed for SQLite
    console.log('\n📦 Generating plugin package.json...');
    const pluginPackageJson = {
      name: 'claude-recall-plugin',
      version: version,
      private: true,
      description: 'Runtime dependencies for claude-recall bundled hooks',
      type: 'module',
      dependencies: {},
      engines: {
        node: '>=18.0.0',
        bun: '>=1.0.0'
      }
    };
    fs.writeFileSync('plugin/package.json', JSON.stringify(pluginPackageJson, null, 2) + '\n');
    console.log('✓ plugin/package.json generated');

    // Build React viewer
    console.log('\n📋 Building React viewer...');
    const { spawn } = await import('child_process');
    const viewerBuild = spawn('node', ['scripts/build-viewer.js'], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      viewerBuild.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Viewer build failed with exit code ${code}`));
        }
      });
    });

    // Build engine service
    console.log(`\n🔧 Building engine service...`);
    await build({
      entryPoints: [ENGINE_SERVICE.source],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: `${hooksDir}/${ENGINE_SERVICE.name}.cjs`,
      minify: true,
      logLevel: 'error', // Suppress warnings (import.meta warning is benign)
      external: ['bun:sqlite'],
      define: {
        '__DEFAULT_PACKAGE_VERSION__': `"${version}"`
      },
      banner: {
        js: '#!/usr/bin/env bun'
      }
    });

    // Make engine service executable
    fs.chmodSync(`${hooksDir}/${ENGINE_SERVICE.name}.cjs`, 0o755);
    const engineStats = fs.statSync(`${hooksDir}/${ENGINE_SERVICE.name}.cjs`);
    console.log(`✓ worker-service built (${(engineStats.size / 1024).toFixed(2)} KB)`);

    // Build search server
    console.log(`\n🔧 Building search server...`);
    await build({
      entryPoints: [SEARCH_SERVER.source],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: `${hooksDir}/${SEARCH_SERVER.name}.cjs`,
      minify: true,
      logLevel: 'error',
      external: ['bun:sqlite'],
      define: {
        '__DEFAULT_PACKAGE_VERSION__': `"${version}"`
      },
      banner: {
        js: '#!/usr/bin/env node'
      }
    });

    // Make search server executable
    fs.chmodSync(`${hooksDir}/${SEARCH_SERVER.name}.cjs`, 0o755);
    const searchServerStats = fs.statSync(`${hooksDir}/${SEARCH_SERVER.name}.cjs`);
    console.log(`✓ search-server built (${(searchServerStats.size / 1024).toFixed(2)} KB)`);

    // Build builder runtime
    console.log(`\n🔧 Building builder runtime...`);
    await build({
      entryPoints: [BUILDER_GENERATOR.source],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: `${hooksDir}/${BUILDER_GENERATOR.name}.cjs`,
      minify: true,
      logLevel: 'error',
      external: ['bun:sqlite'],
      define: {
        '__DEFAULT_PACKAGE_VERSION__': `"${version}"`
      }
    });

    const builderStats = fs.statSync(`${hooksDir}/${BUILDER_GENERATOR.name}.cjs`);
    console.log(`✓ builder-runtime built (${(builderStats.size / 1024).toFixed(2)} KB)`);

    console.log('\n✅ Worker service, MCP server, and context generator built successfully!');
    console.log(`   Output: ${hooksDir}/`);
    console.log(`   - Worker: worker-service.cjs`);
    console.log(`   - MCP Server: search-server.cjs`);
    console.log(`   - Context Generator: builder-runtime.cjs`);

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    if (error.errors) {
      console.error('\nBuild errors:');
      error.errors.forEach(err => console.error(`  - ${err.text}`));
    }
    process.exit(1);
  }
}

buildHooks();
