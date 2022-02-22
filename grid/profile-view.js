
const vscode = acquireVsCodeApi();

const grid = new gridjs.Grid({
    columns: ['item', 'value'],
    data: []
    });

window.addEventListener('message', (event) => {
    switch (event.data.command) {
        case 'data': {
            onGridData(grid, event.data.data);
        }
    }
});

function onGridData(grid, data) {
    grid.updateConfig(data);
    grid.render(document.getElementById("wrapper"));
}

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