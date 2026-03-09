// Deploy site/ to GitHub Pages (gh-pages branch)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function deploy(siteDir, options = {}) {
    siteDir = path.resolve(siteDir);

    if (!fs.existsSync(siteDir) || !fs.existsSync(path.join(siteDir, 'index.html'))) {
        console.error(`❌ No site found at ${siteDir}. Run gsclone first.`);
        process.exit(1);
    }

    // Check git and gh CLI
    try {
        execSync('git --version', { stdio: 'pipe' });
    } catch {
        console.error('❌ git is not installed.');
        process.exit(1);
    }

    const repo = options.repo;
    if (!repo) {
        console.error('❌ --repo is required. Example: gsclone deploy ./clone/site --repo username/my-clone');
        process.exit(1);
    }

    console.log(`\n🚀 Deploying to GitHub Pages...`);
    console.log(`📁 Source: ${siteDir}`);
    console.log(`📦 Repo: ${repo}\n`);

    // Create temp dir, init git, copy files, push to gh-pages
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsclone-deploy-'));

    try {
        // Copy site files to temp dir
        copyDir(siteDir, tmpDir);

        // Init git repo, commit, push
        const cmds = [
            'git init',
            'git checkout -b gh-pages',
            'git add -A',
            'git commit -m "Deploy google-sites-clone"',
            `git remote add origin https://github.com/${repo}.git`,
            'git push -f origin gh-pages',
        ];

        for (const cmd of cmds) {
            console.log(`  $ ${cmd}`);
            execSync(cmd, { cwd: tmpDir, stdio: 'pipe' });
        }

        console.log(`\n✅ Deployed to https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/`);
        console.log(`⚙️  Enable GitHub Pages: repo Settings → Pages → Branch: gh-pages`);
    } catch (e) {
        console.error(`\n❌ Deploy failed: ${e.message}`);
        process.exit(1);
    } finally {
        // Cleanup
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

function copyDir(src, dest) {
    for (const entry of fs.readdirSync(src)) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

module.exports = { deploy };
