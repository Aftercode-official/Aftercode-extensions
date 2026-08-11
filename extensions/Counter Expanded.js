// Name: Counter Expanded
// ID: CounterExpanded
// Description: A tool providing comprehensive counter management features for your game.
// License: MIT

(function(Scratch) {
    'use strict';
    
    if (!Scratch.extensions.unsandboxed) {
        throw new Error("Counter Expanded must be run unsandboxed");
    }

    class CounterExpanded {
        constructor() {
            this.value = 0;
            this.minLimit = -Infinity;
            this.maxLimit = Infinity;
            this.autoRunning = false;
        }

        getInfo() {
            return {
                id: 'CounterExpanded',
                name: 'Counter Expanded',
                color1: "#808080",
                color2: "#4d4d4d",
                color3: "#2e2e2e",

                blocks: [
                    
                    {
                        opcode: 'Counter',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Counter'
                    },

                    
                    {
                        opcode: 'SetCounter',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set counter value [number]',
                        arguments: {
                            number: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },

                    
                    {
                        opcode: 'ChangeCounter',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'change counter value [amount]',
                        arguments: {
                            amount: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },

                    
                    {
                        opcode: 'ClearValue',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'clear counter value'
                    },

                    
                    {
                        blockType: Scratch.BlockType.HAT,
                        opcode: 'CounterEvent',
                        text: 'when counter value [COMPARE] [thisvalue]',
                        arguments: {
                            COMPARE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'COMPARE'
                            },
                            thisvalue: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 10
                            }
                        }
                    },

                    
                    {
                        opcode: 'setMin',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set min limit to [min]',
                        arguments: {
                            min: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },

                    
                    {
                        opcode: 'setMax',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set max limit to [max]',
                        arguments: {
                            max: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 100
                            }
                        }
                    },
                    
                    {
                        opcode: 'DecreaseCounter',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'decrease counter by [amount]',
                        arguments: {
                            amount: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },

                    {
                        opcode: 'autoIncrease',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'auto increment counter every [sec] seconds by [amount]',
                        arguments:{
                            sec: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            amount: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    
                    {
                        opcode: 'StopAuto',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'stop auto increase'
                    },
                    
                    {
                        opcode: 'ResetLimit',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'reset all limit'
                    }

                ],

                menus: {
                    COMPARE: {
                        items: ['>', '<', '=']
                    }
                }
            };
        }

        

        Counter() {
            return this.value;
        }

        SetCounter({ number }) {
            this.value = this.limit(Number(number));
        }

        ChangeCounter({ amount }) {
            this.value = this.limit(this.value + Number(amount));
        }

        ClearValue() {
            this.value = this.limit(0);
        }

        CounterEvent({ COMPARE, thisvalue }) {
            const t = Number(thisvalue);

            if (COMPARE === '>') return this.value > t;
            if (COMPARE === '<') return this.value < t;
            if (COMPARE === '=') return this.value === t;
            return false;
        }

        setMin({ min }) {
            this.minLimit = Number(min);
            this.value = this.limit(this.value);
        }

        setMax({ max }) {
            this.maxLimit = Number(max);
            this.value = this.limit(this.value);
        }

        limit(v) {
            return Math.max(this.minLimit, Math.min(this.maxLimit, v));
        }
        
        DecreaseCounter({ amount }) {
        this.value = this.limit(this.value - Number(amount));
        }
        
        async autoIncrease({ sec, amount }) {
        this.autoRunning = true;

        while (this.autoRunning) {
        await new Promise(resolve => setTimeout(resolve, sec * 1000));

        this.value = this.limit(this.value + Number(amount));
           }
        }
        
        StopAuto() {
            this.autoRunning = false;
        }
        
        ResetLimit(){
            this.minLimit = -Infinity;
            this.maxLimit = Infinity;
        }
    }

    Scratch.extensions.register(new CounterExpanded());
})(Scratch);
