import * as axios from 'axios'
import { getTaskImplementation, aiDevApiUtils } from './utils/utils'


const { getTaskDescription, submitAnswer, getToken } = aiDevApiUtils(axios)
async function main() {
    const taskName = process.argv[2]
    const taskHandler = await getTaskImplementation(taskName)
    if (!taskHandler) {
        console.log('task not implemented')
        return
    }

    const token = await getToken(taskName)
    const data = await getTaskDescription(token)
    const answer = await taskHandler(data)
    
    if (answer) {
        await submitAnswer(token, answer)
    }
}

main()
