#!/usr/bin/env node
// gsclone CLI — Clone Google Sites to static HTML
const { program } = require('commander');
const { clone } = require('../lib/index');

program
    .name('gsclone')
    .description('Clone any Google Sites page to static HTML')
    .version('0.1.0')
    .argument('<url>', 'Google Sites URL to clone')
    .option('-o, --output <dir>', 'Output directory', './clone')
    .option('--no-images', 'Skip image localization')
    .option('--no-youtube', 'Skip YouTube thumbnail download')
    .option('--serve', 'Start local server after build')
    .option('--original-nav', 'Keep original Google Sites navigation (default)', true)
    .option('--custom-nav', 'Use custom sidebar navigation')
    .option('--inline', 'Keep images inline (base64) instead of separate files')
    .action(async (url, options) => {
        console.log(`\n🔄 google-sites-clone v0.1.0\n`);

        if (!url.includes('sites.google.com')) {
            console.error('❌ URL must be a Google Sites page (sites.google.com)');
            process.exit(1);
        }

        try {
            await clone(url, {
                output: options.output,
                images: options.images,
                youtube: options.youtube,
                serve: options.serve,
                nav: options.customNav ? 'custom' : 'original',
                inline: options.inline,
            });
        } catch (e) {
            console.error(`\n❌ Error: ${e.message}`);
            process.exit(1);
        }
    });

program.parse();
