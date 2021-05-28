import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import axios from 'axios'
// import * as elasticsearch from 'elasticsearch'
// import * as httpAwsEs from 'http-aws-es'

const esHost = process.env.ES_ENDPOINT

// const es = new elasticsearch.Client({
//     hosts: [esHost],
//     connectionClass: httpAwsEs
// })

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const searchText = event.queryStringParameters?.q
        var url = !!searchText ? `${esHost}/_search?q=${searchText}~` : `${esHost}/_search`

        var result = (await axios.get(url)).data;

        // if (!!searchText) {
        // result = await es.search({
        //     index: 'notes-index',
        //     type: 'notes',
        //     size: 100,
        //     body: {
        //         query: {
        //             match: {
        //                 message: {
        //                     query: searchText,
        //                     fuzziness: "auto"
        //                 }
        //             }
        //         }
        //     }
        // })
        // }
        // else {
        // result = await es.search({
        //     index: 'notes-index',
        //     type: 'notes',
        //     size: 100
        // })
        // }

        return {
            statusCode: 200,
            body: JSON.stringify({ result })
        }
    })

handler.use(
    cors({
        credentials: true
    })
)
