// function onButtonClick() {
//     console.log('11111111111111111');
// }

(
    function() {
        const vscode = acquireVsCodeApi();

        viewer = document.querySelector('#data-viewer');

        document.querySelector('.btn').addEventListener('click', async () => {

            const table = await viewer.getTable();
            await table.schema(['a']);
            await table.update([{'a': 1}]);

            console.log('================' + viewer);
        });
    }()    
);