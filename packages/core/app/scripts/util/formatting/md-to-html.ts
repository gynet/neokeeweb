// @ts-ignore -- dompurify has no type declarations in this project
import dompurify from 'dompurify';
// @ts-ignore -- marked has no type declarations in this project
import marked from 'marked';

const whiteSpaceRegex = /<\/?p>|<br>|\r|\n/g;

interface MdConvertResult {
    text?: string;
    html?: string;
}

class MdRenderer extends (marked as any).Renderer {
    link(href: string, title: string, text: string): string {
        return super
            .link(href, title, text)
            .replace('<a ', '<a target="_blank" rel="noreferrer noopener" ');
    }
}

const MdToHtml = {
    convert(md: string): MdConvertResult | string {
        if (!md) {
            return '';
        }
        const renderer = new MdRenderer();
        const html: string = (marked as any)(md, { renderer, breaks: true });
        const htmlWithoutLineBreaks = html.replace(whiteSpaceRegex, '');
        const mdWithoutLineBreaks = md.replace(whiteSpaceRegex, '');
        if (htmlWithoutLineBreaks === mdWithoutLineBreaks) {
            return { text: md };
        } else {
            const sanitized: string = dompurify.sanitize(html, { ADD_ATTR: ['target'] });
            return { html: `<div class="markdown">${sanitized}</div>` };
        }
    }
};

export { MdToHtml };
