
export function debug(toprint, message = "Debugging Chunks") {
        const check = this.printed.find(c => JSON.stringify(c) === JSON.stringify(toprint));
        if (check) {
            return null; // No need to print if the chunks haven't changed
        
        }
        else {
            this.printed.push(toprint);
            console.log(message, toprint);
        }

    }
