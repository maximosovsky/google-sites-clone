#!/usr/bin/env node
// gsclone CLI — Clone Google Sites to static HTML
const { program } = require('commander');
const { clone } = require('../lib/index');
const { deploy } = require('../lib/deploy');
const pkg = require('../package.json');

program
    .name('gsclone')
    .description('Clone any Google Sites page to static HTML')
    .version(pkg.version);

// Main command: clone
program
    .argument('<url>', 'Google Sites URL to clone')
    .option('-o, --output <dir>', 'Output directory', './clone')
    .option('--no-images', 'Skip image localization')
    .option('--no-youtube', 'Skip YouTube thumbnail download')
    .option('--serve', 'Start local server after build')
    .option('--original-nav', 'Keep original Google Sites navigation (default)', true)
    .option('--custom-nav', 'Use custom sidebar navigation')
    .option('--inline', 'Keep images inline (base64) instead of separate files')
    .option('--zip', 'Create ZIP archive of the site after build')
    .option('--max-pages <n>', 'Maximum number of pages to clone', parseInt)
    .option('--cooldown <ms>', 'Pause between batches in ms (default: 60000)', parseInt)
    .action(async (url, options) => {
        console.log(`\n🔄 google-sites-clone v${pkg.version}\n`);

        if (!url.includes('sites.google.com')) {
            console.error('❌ URL must be a Google Sites page (sites.google.com)');
            process.exit(1);
        }

        // Auto-install SingleFile CLI if missing
        const { execSync } = require('child_process');
        try {
            execSync('single-file --help', { stdio: 'ignore' });
        } catch {
            console.log('📦 SingleFile CLI not found — installing...');
            try {
                execSync('npm install -g single-file-cli', { stdio: 'inherit' });
                console.log('✅ SingleFile CLI installed\n');
            } catch (e) {
                console.error('❌ Failed to install SingleFile CLI. Run manually: npm install -g single-file-cli');
                process.exit(1);
            }
        }

        try {
            const siteDir = await clone(url, {
                output: options.output,
                images: options.images,
                youtube: options.youtube,
                serve: options.serve,
                nav: options.customNav ? 'custom' : 'original',
                inline: options.inline,
                maxPages: options.maxPages,
                cooldown: options.cooldown,
            });

            if (options.zip) {
                const path = require('path');
                const { createZip } = require('../lib/zip');
                const zipPath = path.join(path.dirname(siteDir), 'site.zip');
                await createZip(siteDir, zipPath);
                console.log(`\n📦 ZIP: ${zipPath}`);
            }
        } catch (e) {
            console.error(`\n❌ Error: ${e.message}`);
            process.exit(1);
        }
    });

// Deploy command: push site/ to gh-pages
program
    .command('deploy <dir>')
    .description('Deploy site directory to GitHub Pages')
    .requiredOption('--repo <owner/name>', 'GitHub repository (e.g. username/my-clone)')
    .action((dir, options) => {
        deploy(dir, { repo: options.repo });
    });

program.parse();
