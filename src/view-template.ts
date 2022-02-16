import * as fs from 'fs';
import * as path from 'path'

const TEMPLATE_SCRIPT: string = '../assets/test.html';

export class Template {
    public content: string;

    constructor() {
        this.content = fs.readFileSync(path.join(__dirname, TEMPLATE_SCRIPT), 'utf8');
    }
}



