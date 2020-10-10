'use strict'

const agentFixture = require('./agent')

const metric = {
  id: 1,
  type: 'TEMPERATURE',
  value: '20',
  agent: agentFixture.byId(1),
  createdAt: new Date(),
  updatedAt: new Date()
}

const metrics = [
  metric,
  extend(metric, { id: 2, value: '40' }),
  extend(metric, { id: 3, type: 'DISTANCE', value: '1300' }),
  extend(metric, { id: 3, value: '0', agent: agentFixture.condor })
]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

module.exports = {
  single: metric,
  all: metrics,

  byUuid: (uuid) =>
    metrics
      .filter((metric) => metric.agent.uuid === uuid)
      .map((metric) => metric.type),

  byUuidAndType: (uuid, type) =>
    metrics.filter(
      (metric) => metric.agent.uuid === uuid && metric.type === type
    )
}
