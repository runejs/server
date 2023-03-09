import { commandActionHandler } from '@engine/action';

const action: commandActionHandler = (details) => {
    const { player } = details;
    const metadata = { ...player.metadata };
    for (const metadataKey of Object.keys(metadata)) {
        if(typeof (metadata as any)[metadataKey] === 'function') {
            (metadata as any)[metadataKey] = typeof (metadata as any)[metadataKey];
        }
        if(Array.isArray((metadata as any)[metadataKey]) && (metadata as any)[metadataKey].length > 30) {
            (metadata as any)[metadataKey] = `Array (${(metadata as any)[metadataKey].length} entries)`;
        }
        if(typeof (metadata as any)[metadataKey] === 'object'&&(metadata as any)[metadataKey] !== null && 'unsubscribe' in (metadata as any)[metadataKey]) {
            (metadata as any)[metadataKey] = `Observable { closed: ${(metadata as any)[metadataKey].closed} }`;
        }
    }
    console.log(metadata);
    const stringified = JSON.stringify(metadata, null, 4);
    stringified.split('\n').forEach((split) => {
        player.sendLogMessage(split, details.isConsole);
        console.log(split);
    })
};

export default {
    pluginId: 'rs:dump_metadata_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'dump_metadata' ],
            handler: action
        }
    ]
};
