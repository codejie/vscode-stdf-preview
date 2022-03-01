
const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
    switch (event.data.command) {
        // case 'cmd_data': {
        //     // onCommandData(event.data.component, event.data.data);
        //     break;
        // }
        case 'cmd_config': {
            onCommandConfig(event.data.component, event.data.data);
            break;
        }
        case 'cmd_component': {
            // console.log('get event - ' + event.data.name);
            onCommandComponent(event.data.id, event.data.title, event.data.desc);
            break;
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

function onCommandComponent(id, title) {
    createRecordGridSection('container', id, title);
}

function onCommandDrawRect(payload) {
    drawRectangles(payload.id, payload.maxX, payload.maxY, payload.data);
}

function createRecordGridSection(parent, id, title) {
    const div = document.getElementById(parent);
    
    const label = document.createElement('div');
    label.setAttribute("width", "100%");
    label.innerHTML = title;

    const holder = document.createElement('div');
    holder.className = 'grid_holder';
    holder.id = id;

    div.appendChild(label);
    div.appendChild(holder);
}
