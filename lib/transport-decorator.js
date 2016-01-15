/**
 * @module kad-telemetry/transport-decorator
 */

'use strict';

var inherits = require('util').inherits;
var Persistence = require('./persistence');
var metrics = require('./metrics');

/**
 * Returns a decorated transport adapter that writes telemetry data
 * @constructor
 * @param {kad.RPC} Transport
 */
function TransportDecorator(Transport) {

  function TelemetryTransport(contact, options) {
    if (!(this instanceof TelemetryTransport)) {
      return new TelemetryTransport(contact, options);
    }

    this._telemetry = { options: options.telemetry || {} };
    this._telemetry.source = new Persistence(this._telemetry.options.filename);

    Transport.call(this, contact, options);
  }

  inherits(TelemetryTransport, Transport);

  TelemetryTransport.DEFAULTS = [
    metrics.Latency,
    metrics.Availability
  ];

  /**
   * Wraps _open with telemetry hooks setup
   * #_open
   * @param {Function} callback
   */
  TelemetryTransport.prototype._open = function(callback) {
    var self = this;
    var metrics = this._telemetry.options.metrics;

    if (!metrics || metrics.length === 0) {
      this._telemetry.options.metrics = TelemetryTransport.DEFAULTS;
    }

    this._telemetry.options.metrics.forEach(function(Metric) {
      var metric = new Metric();

      metric.hooks.forEach(function(hook) {
        self[hook.trigger](
          hook.event,
          hook.handler(metric, self._telemetry.source)
        );
      });
    });

    return Transport.prototype._open.call(this, callback);
  };

  return TelemetryTransport;
}

module.exports = TransportDecorator;