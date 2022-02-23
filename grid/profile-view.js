
const vscode = acquireVsCodeApi();

// var gridData = [];

console.log('====================');

const components = initComponents();

// Object.keys(components).forEach(key => {
//     components[key].instance.updateConfig({columns: ['Item', 'Value', 'Item', 'Value'],data: []}).render(document.getElementById(key));    
// });

window.addEventListener('message', (event) => {
    console.log('get event - ' + event.data.toString());
    // console.log('get event - ' + event.data.command.toString());
    // console.log('get event - ' + event.data.data.toString());
    switch (event.data.command) {
        case 'cmd_data': {
            onCommandData(event.data.component, event.data.data);
            break;
        }
        // case 'cmd_reset': {
        //     console.log('cmd_reset - ' + gridData);
        //     components['MIR_GRID'].instance.updateConfig({
        //         fixedHeader: true,
        //         data: []
        //     }).render(document.getElementById(component));
        //     break;
        // }
    }
});

function initComponents() {
    return {
        'MIR_GRID': {
            type: 'grid',
            instance: new gridjs.Grid({
                // fixedHeader: true,
                columns: ['Item', 'Value', 'Item', 'Value'],
                data: [],
                style: {
                    table: {
                        width: '100%'
                    }
                }                
            })
        },
        'WIR_GRID': {
            type: 'grid',
            instance: new gridjs.Grid({
                // fixedHeader: true,
                columns: ['Item', 'Value', 'Item', 'Value'],
                data: [],
                style: {
                    table: {
                        width: '100%'
                    }
                }
            })
        },        
    };
}

function updateGridData(component, data) {
    console.log('updateGridData - ' + component);
    // gridData = data;
    // components[component].instance.render(document.getElementById(component));
    // console.log('updateGridData - ' + gridData);
    components[component].instance.updateConfig({
        // fixedHeader: true,
        data: data
    }).render(document.getElementById(component));
}

function onCommandData(component, data) {
    console.log('onCommandData - ' + component);
    console.log('onCommandData - ' + data);
    updateGridData(component, data);        
}


// function onGridData(grid, data) {
//     console.log('onGridData - ' + data);
//     grid.updateConfig(data);
//     grid.render(document.getElementById("wrapper"));
// }

// (
//     function() {
//         const vscode = acquireVsCodeApi();

//         const grid = new gridjs.Grid({
//             columns: ['item', 'value'],
//             data: []
//           });

//         window.addEventListener('message', (event) => {
//             switch (event.data.command) {
//                 case 'data': {
//                     onGridData(grid, event.data.data);
//                 }
//             }
//         });

//         document.querySelector('.btn').addEventListener('click', async () => {

//         grid.updateConfig({
//             data: [['1'],['2']]
//         });

//         grid.render(document.getElementById("wrapper"));

//         console.log('================' + viewer);
//         });

//         // new gridjs.Grid({
//         //     columns: ["Name", "Email", "Phone Number"],
//         //     data: [
//         //       ["John", "john@example.com", "(353) 01 222 3333"],
//         //       ["Mark", "mark@gmail.com", "(01) 22 888 4444"],
//         //       ["Eoin", "eoin@gmail.com", "0097 22 654 00033"],
//         //       ["Sarah", "sarahcdd@gmail.com", "+322 876 1233"],
//         //       ["Afshin", "afshin@mail.com", "(353) 22 87 8356"]
//         //     ]
//         //   }).render(document.getElementById("wrapper"));
//     }()
    
//     function onGridData(grid, data): void {

//     }
// );