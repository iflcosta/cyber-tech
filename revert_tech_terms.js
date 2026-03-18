const fs = require('fs');
const path = require('path');

const technicalReversions = {
    "Node": "Node",
    "node": "node",
    "Mono": "Mono",
    "mono": "mono",
    "none": "none",
    "None": "None",
    "noscript": "noscript",
    "Noscript": "Noscript",
    "canonical": "canonical",
    "Canonical": "Canonical",
    "Nota": "Nota", // From sentiment analysis prompt
    "nota": "nota"
};

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walk(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.md') || file.endsWith('.js')) {
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                let changed = false;
                for (const [key, val] of Object.entries(technicalReversions)) {
                    if (content.includes(key)) {
                        content = content.split(key).join(val);
                        changed = true;
                    }
                }
                if (changed) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Reverted: ${fullPath}`);
                }
            } catch (err) {
                console.error(`Error reading ${fullPath}: ${err.message}`);
            }
        }
    }
}

walk('src');
walk('.'); 
console.log("Technical reversion complete.");
