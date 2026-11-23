// Name: Async Await
// ID: asyncawait
// Description: Async Await Extension for Scratch
// By: ezx6t
// License: MIT
class AsyncAwait {
  getInfo() {
    return {
      id: 'asyncawait',
	  color1: "#0099ff",
      color2: "#0087e0",
      color3: "#0074c2",
      name: 'Async Await',
      blocks: [
        {
          opcode: 'define_',
          blockType: Scratch.BlockType.CONDITIONAL,
          text: 'define function and save to [VAR]',
		  arguments: {
			VAR: {
			  type: Scratch.ArgumentType.VARIABLE
			}
		  }
        },
		{
          opcode: 'async_',
          blockType: Scratch.BlockType.COMMAND,
          text: 'asynchronously run function in [VAR] and save call to [VAR2]',
		  arguments: {
			VAR: {
			  type: Scratch.ArgumentType.VARIABLE
			},
			VAR2: {
			  type: Scratch.ArgumentType.VARIABLE
			}
		  }
        },
		{
          opcode: 'await_',
          blockType: Scratch.BlockType.REPORTER,
          text: 'await function call in [VAR]',
		  arguments: {
			VAR: {
			  type: Scratch.ArgumentType.VARIABLE
			}
		  }
        },
		{
          opcode: 'return_',
          blockType: Scratch.BlockType.COMMAND,
          text: 'return [DAT]',
		  isTerminal: true,
		  arguments: {
			DAT: {
			  type: Scratch.ArgumentType.STRING
			}
		  }
        }
      ]
    };
  }
  runThreadAsync(rt, tg, sbi) {
    return new Promise((resolve) => {
      if (!sbi) {
        resolve();
        return;
      }
      const thr = rt._pushThread(sbi, tg);
      const doneStat = 4;
      const simi = setInterval(() => {
        if (thr.status === doneStat || !rt.threads.includes(thr)) {
          clearInterval(simi);
          resolve(thr._ez2a_return);
        }
	  }, 10);
    });
  }
  getVar(name, util) {
	return util.target.lookupVariableById(name) || util.target.lookupVariableByNameAndType(name);
  }
  define_(args, util) {
	this.getVar(args.VAR, util).value = util.target.blocks.getBranch(util.thread.peekStack(), 1);
  }
  async_(args, util) {
	const rt = util.runtime;
	const tg = util.target;
	const sbi = this.getVar(args.VAR, util).value;
	this.getVar(args.VAR2, util).value = this.runThreadAsync(rt, tg, sbi);
  }
  async await_(args, util) {
	return await this.getVar(args.VAR, util).value;
  }
  return_(args, util) {
	util.thread._ez2a_return = args.DAT;
	util.stopThisScript();
  }
}
Scratch.extensions.register(new AsyncAwait());
