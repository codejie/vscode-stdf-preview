
const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
    switch (event.data.command) {
        case 'cmd_data': {
            // onCommandData(event.data.component, event.data.data);
            break;
        }
        case 'cmd_config': {
            onCommandConfig(event.data.component, event.data.data);
            break;
        }
        case 'cmd_record': {
            console.log('get event - ' + event.data.name);
            onCommandRecord(event.data.id, event.data.title, event.data.desc);
        }
    }
});

function onCommandConfig(component, data) {
    const grid = new gridjs.Grid({
        ...data,
        style: {
            table: {
                width: '100%'
            }
        }                
    }).render(document.getElementById(component));
}

function onCommandRecord(id, name, desc) {
    createRecordGridSection('container', `<font size="6pt">${name}</font>&nbsp;&nbsp;<font size="4pt">(${desc})</font>`, id);
}
