const handler = () => {};

export default [
    {
        opcode: 234,
        size: 4,
        handler: handler
    }, {
        opcode: 160,
        size: 1,
        handler: handler
    }, {
        opcode: 216,
        size: 0,
        handler: handler
    }, {
        opcode: 13,
        size: 0,
        handler: handler
    }, {
        opcode: 58, // camera move
        size: 4,
        handler: handler
    }, {
        opcode: 121,
        size: 4,
        handler: handler
    }, {
        opcode: 178,
        size: 0,
        handler: handler
    }
];
