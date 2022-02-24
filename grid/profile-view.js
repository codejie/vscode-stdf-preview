
const vscode = acquireVsCodeApi();

// const components = initComponents();

window.addEventListener('message', (event) => {
    // console.log('get event - ' + event.data.toString());
    // console.log('get event - ' + event.data.command.toString());
    // console.log('get event - ' + event.data.data.toString());
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
            onCommandRecord(event.data.name, event.data.desc);
        }
    }
});

// function initComponents() {
//     return {
//         'MIR_GRID': {
//             type: 'grid',
//             instance: new gridjs.Grid({
//                 // fixedHeader: true,
//                 columns: ['Item', 'Value', 'Item', 'Value'],
//                 data: [],
//                 style: {
//                     table: {
//                         width: '100%'
//                     }
//                 }                
//             })
//         },
//         'WIR_GRID': {
//             type: 'grid',
//             instance: new gridjs.Grid({
//                 // fixedHeader: true,
//                 columns: ['Item', 'Value', 'Item', 'Value'],
//                 data: [],
//                 style: {
//                     table: {
//                         width: '100%'
//                     }
//                 }
//             })
//         },        
//     };
// }

// function updateGridData(component, data) {
//     console.log('updateGridData - ' + component);
//     components[component].instance.updateConfig(data).render(document.getElementById(component));
// }

// function onCommandData(component, data) {
//     console.log('onCommandData - ' + component);
//     console.log('onCommandData - ' + data);
//     updateGrid(component, {
//         data: data
//     });        
// }

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

function onCommandRecord(name, desc) {
    createRecordGridSection('container', `<font size="6pt">${name}</font>&nbsp;&nbsp;<font size="4pt">(${desc})</font>`, `${name}_GRID`);
}
