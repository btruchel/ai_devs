# ai_devs 2 reloaded CLI
*by btruchel*
## new task handling
- add a new task file with a handler function 
```
export async function handler(data: TaskResponseData ): Promise<Answer | void> {}
```
- get the task description from ai_devs api by calling `npm start newTask` (`ex. npm start helloapi`)
- implement the rest of the function to answer the task description
