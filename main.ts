import { getTaskImplementation, aiDevApiUtils } from './utils/utils'


const { getTaskDescription, submitAnswer, showMessage } = aiDevApiUtils()
async function main() {
    const taskName = process.argv[2]
    const { handler: taskHandler, additionalStep } = (await getTaskImplementation(taskName)) || {}
    if (!taskHandler) {
        console.log('task not implemented')
        return
    }

    const { data, token } = await getTaskDescription(taskName)
    showMessage(data)
    const answer = await (additionalStep 
        ? additionalStep(token).then(taskHandler) 
        : taskHandler(data)
    )
    if (answer) {
        await submitAnswer(token, answer)
    }
}

main()
