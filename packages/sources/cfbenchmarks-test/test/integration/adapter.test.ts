import * as process from 'process'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { mockWebSocketProvider, mockWebSocketServer, setEnvVariables } from './setup'
// import { mockResponseSuccess } from './fixtures'
import { createAdapter } from './setup'
import { Server } from 'mock-socket'

// describe('rest', () => {
//   jest.setTimeout(10000)

//   let fastify: ServerInstance | undefined
//   let req: SuperTest<Test>

//   const data: AdapterRequestBody = {
//     data: {
//       index: 'BRTI',
//     },
//   }

//   let oldEnv: NodeJS.ProcessEnv
//   beforeAll(async () => {
//     oldEnv = JSON.parse(JSON.stringify(process.env))
//     process.env['CACHE_MAX_AGE'] = '5000'
//     process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
//     process.env['METRICS_ENABLED'] = 'false'
//     process.env['WS_ENABLED'] = 'false'
//     process.env['API_USERNAME'] = 'fake-api-username'
//     process.env['API_PASSWORD'] = 'fake-api-password'
//     fastify = await expose(createAdapter())
//     req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
//     mockResponseSuccess()
//     // Send initial request to start background execute
//     await req.post('/').send(data)
//     await sleep(5000)
//   })

//   afterAll((done) => {
//     setEnvVariables(oldEnv)
//     fastify?.close(done())
//   })

//   describe('crypto endpoint', () => {
//     it('should return success', async () => {
//       const makeRequest = () =>
//         req
//           .post('/')
//           .send(data)
//           .set('Accept', '*/*')
//           .set('Content-Type', 'application/json')
//           .expect('Content-Type', /json/)

//       const response = await makeRequest()
//       expect(response.body).toMatchSnapshot()
//     }, 30000)
//   })
// })

describe('websocket', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let spy: jest.SpyInstance
  let mockWsServer: Server | undefined
  const wsEndpoint = 'ws://localhost:9090'

  jest.setTimeout(10000)

  const data: AdapterRequestBody = {
    data: {
      index: 'BRTI',
    },
  }

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_ENABLED'] = 'true'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'

    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    // Send initial request to start background execute
    await req.post('/').send(data)
    await sleep(5000)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    fastify?.close(done())
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
      const response = await makeRequest()
      expect(response.body).toEqual({
        result: 40067,
        statusCode: 200,
        data: { result: 40067 },
        timestamps: {
          providerDataReceived: 1652198967193,
          providerDataStreamEstablished: 1652198967193,
          providerIndicatedTime: 1645203822000,
        },
      })
    }, 30000)
  })

  describe('input validation', () => {
    it('should return error (empty body)', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send({})
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)

      const response = await makeRequest()
      expect(response.statusCode).toEqual(400)
    }, 30000)
    it('should return error (empty data)', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send({ data: {} })
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)

      const response = await makeRequest()
      expect(response.statusCode).toEqual(400)
    }, 30000)
    it('should return error (empty base)', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send({ data: { quote: 'BTC' } })
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)

      const response = await makeRequest()
      expect(response.statusCode).toEqual(400)
    }, 30000)
    it('should return error (empty quote)', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send({ data: { base: 'ETH' } })
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)

      const response = await makeRequest()
      expect(response.statusCode).toEqual(400)
    }, 30000)
  })
})
