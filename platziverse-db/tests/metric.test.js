'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const metricFixture = require('./fixtures/metric');
const agentFixture = require('./fixtures/agent');

const config = {
  logging: function () {}
};

let MetricStub = null;
let db = null;
let AgentStub = null;
let sandbox = null;

const agentUuid = 'yyy-yyy-yyy';
const metricType = 'DISTANCE';
const newMetric = {
  type: 'CPU',
  value: '60'
};

const findByTypeAgentUuidArgs = {
  attributes: ['type', 'id', 'value', 'createdAt'],
  group: ['type'],
  where: { type: 'DISTANCE' },
  limit: 20,
  order: [['createdAt', 'DESC']],
  include: [
    {
      attributes: [],
      model: AgentStub,
      where: {
        uuid: agentUuid
      }
    }
  ],
  raw: true
};

const findByAgentUuidArgs = {
  attributes: ['type'],
  group: ['type'],
  include: [
    {
      attributes: [],
      model: AgentStub,
      where: {
        uuid: agentUuid
      }
    }
  ],
  raw: true
};

const agentUuidArgs = {
  where: { uuid: agentUuid }
};

const metricCreateArg = Object.assign(newMetric, {
  agentId: agentFixture.byUuid(agentUuid).id
});

test.beforeEach(async () => {
  sandbox = sinon.createSandbox();

  AgentStub = {
    hasMany: sinon.spy()
  };

  MetricStub = {
    belongsTo: sinon.spy()
  };

  findByAgentUuidArgs.include[0].model = AgentStub;
  findByTypeAgentUuidArgs.include[0].model = AgentStub;

  AgentStub.findOne = sandbox.stub();
  AgentStub.findOne.withArgs(agentUuid).returns(agentFixture.byUuid(agentUuid));

  MetricStub.findAll = sandbox.stub();
  MetricStub.findAll
    .withArgs(findByAgentUuidArgs)
    .returns(metricFixture.byUuid(agentUuid));

  MetricStub.findAll
    .withArgs(findByTypeAgentUuidArgs)
    .returns(metricFixture.byUuidAndType(agentUuid, metricType));

  AgentStub.findOne = sandbox.stub();
  AgentStub.findOne
    .withArgs(agentUuidArgs)
    .returns(agentFixture.byUuid(agentUuid));

  MetricStub.create = sandbox.stub();
  MetricStub.create.withArgs(metricCreateArg).returns({
    toJSON() {
      return newMetric;
    }
  });
  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  });

  db = await setupDatabase(config);
});

test.afterEach((t) => {
  sandbox && sandbox.restore();
});

test('Metric', (t) => {
  t.truthy(db.Metric, 'Metric service should exists');
});

test.serial('Setup Metric', (t) => {
  t.true(MetricStub.belongsTo.called, 'MetricMode.belongsTo was executed');
  t.true(
    MetricStub.belongsTo.calledWith(AgentStub),
    'Argument should be the AgentModel'
  );
});

test.serial('Metric#findByAgentUuid', async (t) => {
  const metrics = await db.Metric.findByAgentUuid(agentUuid);

  t.true(MetricStub.findAll.called, 'findAll should be called');
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called Once');
  t.true(
    MetricStub.findAll.calledWith(findByAgentUuidArgs),
    'findAll should be called with findByAgentUuidArgs'
  );

  t.deepEqual(metrics, metricFixture.byUuid(agentUuid), 'should be the same');
});

test.serial('Metric#findByTypeAgentUuid', async (t) => {
  const metrics = await db.Metric.findByTypeAgentUuid(metricType, agentUuid);

  t.true(MetricStub.findAll.called, 'findAll should be called');
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called Once');
  t.true(
    MetricStub.findAll.calledWith(findByTypeAgentUuidArgs),
    'findAll should be called with findByAgentUuidArgs'
  );

  t.deepEqual(
    metrics,
    metricFixture.byUuidAndType(agentUuid, metricType),
    'should be the same'
  );
});

test.serial('Metric#create', async (t) => {
  const metric = await db.Metric.create(agentUuid, newMetric);

  t.true(AgentStub.findOne.called, 'Agent findOne should be called');
  t.true(AgentStub.findOne.calledOnce, 'Agent findOne should be called Once');
  t.true(
    AgentStub.findOne.calledWith(agentUuidArgs),
    'AgentStub findOne should be called with agentUuidArgs'
  );

  t.true(MetricStub.create.called, 'Metric findAOne should be called');
  t.true(MetricStub.create.calledOnce, 'Metric findAOne should be called Once');
  t.true(
    MetricStub.create.calledWith(metricCreateArg),
    'MetricStub findOne should be called with metricCreateArg'
  );

  t.deepEqual(metric, newMetric, 'should be the same');
});
