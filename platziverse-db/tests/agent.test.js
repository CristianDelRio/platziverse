'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const agentFixture = require('./fixtures/agent')

const config = {
  logging: function () {}
}

const MetricStub = {
  belongsTo: sinon.spy()
}

const single = Object.assign({}, agentFixture.single)
const id = 1
let AgentStub = null
let db = null
let sandbox = null
const uuid = 'yyy-yyy-yyy'
const username = 'condor'
const uuidArgs = {
  where: { uuid }
}

const connectedArgs = {
  where: { connected: true }
}

const usernameArgs = { where: { username: 'condor' } }

const newAgent = {
  uuid: '123-123-123',
  name: 'test_name',
  username: 'test_username',
  hostname: 'test_hostname',
  pid: 0,
  connected: false
}

test.beforeEach(async () => {
  sandbox = sinon.createSandbox()

  AgentStub = {
    hasMany: sandbox.spy()
  }

  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(agentFixture.byId(id))

  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(agentFixture.byUuid(uuid))

  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(single)

  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns({
    toJSON () {
      return newAgent
    }
  })

  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(agentFixture.all)
  AgentStub.findAll.withArgs(connectedArgs).returns(agentFixture.connected)
  AgentStub.findAll.withArgs(usernameArgs).returns(agentFixture.condor)

  const setupDatabase = proxyquire('..', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach((t) => {
  sandbox && sandbox.restore()
})

test('Agent', (t) => {
  t.truthy(db.Agent, 'Agent service should exists')
})

test.serial('Setup Agent', (t) => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(
    AgentStub.hasMany.calledWith(MetricStub),
    'Argument should be the MetricModel'
  )
})

test.serial('Agent#findById', async (t) => {
  const agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'findById Should be Called on model')
  t.true(AgentStub.findById.calledOnce, 'findById Should be Called Once')
  t.true(
    AgentStub.findById.calledWith(id),
    'findById Should be Called With Specific Id'
  )

  t.deepEqual(agent, agentFixture.byId(id), 'should be the same')
})

test.serial('Agent#findUuid', async (t) => {
  const agent = await db.Agent.findByUuid(uuid)

  t.true(AgentStub.findOne.called, 'findOne Should be Called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne Should be Called Once')
  t.true(
    AgentStub.findOne.calledWith(uuidArgs),
    'findOne Should be Called With Specific Id'
  )

  t.deepEqual(agent, agentFixture.byUuid(uuid), 'should be the same')
})

test.serial('Agent#createOrUpdate - exists', async (t) => {
  const agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.calledTwice, 'findOne Should be Called Twice')
  t.true(
    AgentStub.findOne.calledWith(uuidArgs),
    'findOne Should be Called with uuid Args'
  )
  t.true(AgentStub.update.calledOnce, 'update Should be Called Once')

  t.deepEqual(agent, single, 'should be the same')
})

test.serial('Agent#createOrUpdate - new', async (t) => {
  const agent = await db.Agent.createOrUpdate(newAgent)

  t.true(AgentStub.findOne.calledOnce, 'findOne Should be Called Once')
  t.true(AgentStub.update.notCalled, 'update Should not be Called')
  t.true(AgentStub.create.calledOnce, 'created Should be Called Once')
  t.true(
    AgentStub.create.calledWith(newAgent),
    'create Should be Called with newAgent as Arg'
  )

  t.deepEqual(agent, newAgent, 'should be the same')
})

test.serial('Agent#findConnected', async (t) => {
  const agents = await db.Agent.findConnected()

  t.true(AgentStub.findAll.calledOnce, 'findAll Should be Called Once')
  t.true(
    AgentStub.findAll.calledWith(connectedArgs),
    'findAll Should be Called with connected Args'
  )
  t.is(
    agents.length,
    agentFixture.connected.length,
    'agents should have the same length'
  )
  t.deepEqual(agents, agentFixture.connected, 'should be the same')
})

test.serial('Agent#findAll', async (t) => {
  const agents = await db.Agent.findAll()

  t.true(AgentStub.findAll.calledOnce, 'findAll Should be Called Once')
  t.true(
    AgentStub.findAll.calledWith(),
    'findAll Should be Called with no Args'
  )
  t.is(
    agents.length,
    agentFixture.all.length,
    'agents should have the same length'
  )
  t.deepEqual(agents, agentFixture.all, 'agents should be the same')
})

test.serial('Agent#findByUsername', async (t) => {
  const agents = await db.Agent.findByUsername(username)

  t.true(AgentStub.findAll.calledOnce, 'findAll Should be Called Once')
  t.true(
    AgentStub.findAll.calledWith(usernameArgs),
    'findAll Should be Called with username Args'
  )
  t.is(
    agents.length,
    agentFixture.condor.length,
    'agents should have the same length'
  )
  t.deepEqual(agents, agentFixture.condor, 'agents should be the same')
})
