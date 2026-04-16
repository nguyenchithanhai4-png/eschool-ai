const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function mergeDashboards() {
    console.log("Reading files...");
    const oldHtml = fs.readFileSync('public/student-dashboard-bkup.html', 'utf8');
    const newHtml = fs.readFileSync('_stitch_temp/stitch/b_ng_i_u_khi_n_h_c_sinh_e_school_ai/code.html', 'utf8');

    const $old = cheerio.load(oldHtml);
    const $new = cheerio.load(newHtml);

    console.log("Disabling Tailwind preflight...");
    const tailwindConfig = $new('#tailwind-config').html();
    const updatedTailwindConfig = tailwindConfig.replace('darkMode: "class",', 'corePlugins: { preflight: false }, darkMode: "class",');
    $new('#tailwind-config').html(updatedTailwindConfig);

    console.log("Copying stylesheets, scripts, and fonts from old...");
    // We want to link ALL old stylesheets, scripts, and style blocks regardless of where they are!
    $old('link, style, head > script').each((i, el) => {
        const tagOuter = $old.html(el);
        // Don't copy if it's the old font Be Vietnam Pro, Tailwind uses Inter
        if (!tagOuter.includes('Be Vietnam Pro') && !tagOuter.includes('tailwind.config')) {
            $new('head').append(tagOuter);
        }
    });

    console.log("Merging DOM elements...");
    // Get all view sections from old
    const views = $old('.view-section');
    
    // Find main content container in new (the one after header)
    const newMain = $new('main');
    
    // Clear out the dummy chat content in new, keep header
    $new('main > div').remove();
    
    // Create a container for the old views
    newMain.append('<div id="new-view-container" class="flex-1 overflow-y-auto custom-scrollbar relative p-4 h-full" style="padding-top: 5rem;"></div>');
    
    // Append all views into the container
    const viewContainer = $new('#new-view-container');
    views.each((i, el) => {
        // Simple outerHTML
        const tagOuter = $old.html(el);
        viewContainer.append(tagOuter);
    });

    console.log("Injecting DOM Polyfill for missing IDs...");
    const polyfill = `
    <script>
        // DOM Polyfill for Legacy UI Migration
        const _getEl = document.getElementById.bind(document);
        document.getElementById = function(id) {
            let el = _getEl(id);
            if (!el && id) {
                el = document.createElement('div');
                el.id = id;
                el.style.display = 'none';
                document.body.appendChild(el);
                // console.warn('Polyfilled missing element:', id);
            }
            return el;
        };
    </script>
    `;
    $new('body').append(polyfill);

    console.log("Copying bottom scripts...");
    // Copy the massive JS logic at the end of body
    $old('body script').each((i, el) => {
        // Only append scripts that actually have content or point to local logic
        const scriptOuter = $old.html(el);
        $new('body').append(scriptOuter);
    });
    
    // Connect new sidebar items to switchTab
    $new('.nav-item').each((i, el) => {
        const viewName = $new(el).attr('data-view');
        if (viewName) {
            // Note: old code uses switchTab('tutor-view', element)
            $new(el).attr('onclick', `switchTab('${viewName}-view', this)`);
        }
    });

    console.log("Saving back to public/...");
    // Write out the merged result
    fs.writeFileSync('public/student-dashboard.html', $new.html(), 'utf8');
    
    console.log("Merge complete!");
}

mergeDashboards().catch(console.error);
