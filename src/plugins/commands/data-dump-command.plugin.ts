import { commandActionHandler } from '@engine/action';
import { DataDumpResult, dumpItems, dumpNpcs, dumpObjects, dumpWidgets } from '@engine/config/data-dump';


const action: commandActionHandler = ({ player, args, isConsole }) => {
    const dataType = args.dataType as string;

    const functionMap: { [key: string]: () => DataDumpResult } = {
        'npcs': dumpNpcs,
        'items': dumpItems,
        'objects': dumpObjects,
        'widgets': dumpWidgets,
    };

    const types = Object.keys(functionMap);

    if(types.indexOf(dataType) === -1) {
        player.sendLogMessage(`Invalid data type, please use one of the following:`, isConsole);
        player.sendLogMessage(`[ ${types.join(', ')} ]`, isConsole);
        return;
    }

    let dataName = dataType;
    if(dataType.endsWith('s')) {
        dataName = dataType.substring(0, dataType.length - 2);
    }

    player.sendLogMessage(`Dumping ${dataName} data...`, isConsole);
    const result = functionMap[dataType]();

    if(result.successful) {
        player.sendLogMessage(`Saved ${dataName} data to ${result.filePath}.`, isConsole);
    } else {
        player.sendLogMessage(`Error dumping ${dataName} data.`, isConsole);
    }
};

export default {
    pluginId: 'rs:data_dump_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'dump', 'data', 'datadump', 'dd' ],
            args: [
                {
                    name: 'dataType',
                    type: 'string'
                }
            ],
            handler: action
        }
    ]
};
