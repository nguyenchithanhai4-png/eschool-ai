const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', '_backups');
const CORE_PATHS = [
    'public',
    'routes',
    'services',
    'server.js',
    'package.json'
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function backup() {
    console.log('🚀 Starting Pre-AI Backup...');
    const timestamp = getTimestamp();
    const targetDir = path.join(BACKUP_DIR, timestamp);
    ensureDir(targetDir);

    CORE_PATHS.forEach(p => {
        const source = path.join(__dirname, '..', p);
        const target = path.join(targetDir, p);
        if (fs.existsSync(source)) {
            if (fs.lstatSync(source).isDirectory()) {
                copyDir(source, target);
            } else {
                fs.copyFileSync(source, target);
            }
        }
    });
    console.log(`✅ Backup created at: ${targetDir}`);
}

function copyDir(src, dest) {
    ensureDir(dest);
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

function commitCheckpoint() {
    try {
        console.log('📦 Creating Git Checkpoint...');
        execSync('git add .', { stdio: 'inherit' });
        // Check if there are changes to commit
        const status = execSync('git status --porcelain').toString();
        if (status) {
            execSync(`git commit -m "AI Safety Checkpoint: ${getTimestamp()}"`, { stdio: 'inherit' });
            console.log('✅ Git Checkpoint created.');
        } else {
            console.log('ℹ️ No changes to commit.');
        }
    } catch (err) {
        console.warn('⚠️ Git Checkpoint failed (maybe not a git repo or no git installed).');
    }
}

function validate() {
    console.log('🔍 Validating files for corruption...');
    const errors = [];
    
    function scanDir(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const p = path.join(dir, file);
            if (fs.lstatSync(p).isDirectory()) {
                if (file !== 'node_modules' && file !== '_backups' && file !== '.git') {
                    scanDir(p);
                }
            } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
                const content = fs.readFileSync(p, 'utf8');
                if (content.includes('L?i') || content.includes('ï¿½')) {
                    errors.push(`❌ Potential corruption in: ${p}`);
                }
            }
        });
    }

    scanDir(path.join(__dirname, '..'));
    
    if (errors.length > 0) {
        errors.forEach(e => console.error(e));
        process.exit(1);
    } else {
        console.log('✅ Validation passed. No known corruption patterns found.');
    }
}

const args = process.argv.slice(2);
const command = args[0] || 'all';

if (command === 'backup' || command === 'all') {
    commitCheckpoint();
    backup();
}

if (command === 'validate' || command === 'all') {
    validate();
}
