const fs = require('fs');
const path = require('path');

module.exports = function loadScss(scssSource) {
    const callback = this.async();

    const iconFontScssPath = path.resolve('app/styles/base/_icon-font.scss');
    const whitesurDir = path.resolve('app/icons/whitesur');

    this.addDependency(iconFontScssPath);

    // 1. Generate WhiteSur icon SCSS variables from SVG files
    let whitesurVars = '';
    try {
        const svgFiles = fs.readdirSync(whitesurDir).filter((f) => f.endsWith('.svg'));
        for (const file of svgFiles) {
            const filePath = path.join(whitesurDir, file);
            this.addDependency(filePath);
            const svgData = fs.readFileSync(filePath);
            const b64 = svgData.toString('base64');
            // Convert filename to SCSS variable name: desktop.svg → $ws-icon-desktop
            const varName = file.replace(/\.svg$/, '').replace(/[^a-zA-Z0-9]/g, '-');
            whitesurVars += `$ws-icon-${varName}: url('data:image/svg+xml;base64,${b64}');\n`;
        }
    } catch (e) {
        // whitesur dir missing is non-fatal
    }

    // 2. Generate FA icon class definitions
    fs.readFile(iconFontScssPath, 'utf-8', (err, iconFontScssSource) => {
        if (err) {
            return callback(err);
        }
        const faClasses = [...iconFontScssSource.matchAll(/\n\$fa-var-([\w-]+):/g)]
            .map(([, name]) => name)
            .map((icon) => `.fa-${icon}:before { content: $fa-var-${icon}; }`)
            .join('\n');

        // Prepend WhiteSur variables (must be before usage), append FA classes
        scssSource = whitesurVars + scssSource + '\n' + faClasses;
        callback(null, scssSource);
    });
};
