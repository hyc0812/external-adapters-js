import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import {
  buildGlobalRequestBody,
  constructEntry,
  GlobalEndpointTypes,
  inputParameters,
} from '../global-utils'

const batchEndpointTransport = new BatchWarmingTransport<GlobalEndpointTypes>({
  prepareRequest: (_, config) => buildGlobalRequestBody(config),
  parseResponse: (params, res) =>
    params.map((requestPayload) => constructEntry(res, requestPayload, 'market_cap_percentage')),
})

export const endpoint = new AdapterEndpoint({
  name: 'dominance',
  aliases: ['market_cap_percentage'],
  transport: batchEndpointTransport,
  inputParameters,
})
