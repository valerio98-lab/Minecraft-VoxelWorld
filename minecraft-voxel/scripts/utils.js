
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

export function save(world){
    localStorage.setItem('minecraft_params', JSON.stringify(world.params));
    localStorage.setItem('user_data', JSON.stringify(world.dataStore.data));
    document.getElementById('save-status').innerHTML = 'Game saved successfully!';
    setTimeout(() => {
        document.getElementById('save-status').innerHTML = '';
    }, 2000);
}

export function load(){
    const params = localStorage.getItem('minecraft_params');
    const userData = localStorage.getItem('user_data');
    return {
        params: params ? JSON.parse(params) : {},
        userData: userData ? JSON.parse(userData) : {}
    };

    
}
