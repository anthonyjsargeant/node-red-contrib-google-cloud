/*
* Copyright 2019 Google Inc.
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = 'google-cloud-monitoring';
    const monitoring = require('@google-cloud/monitoring');


    function MonitoringNode(config) {
        RED.nodes.createNode(this, config);

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }

        const node = this;
        let metricServiceClient = null;
        let metricType = config.metricType;  // custom.googleapis.com/global/numeric_metric
        let projectId = config.projectId;
        const credentials = GetCredentials(config.account);
        node.log("I was started!");

        async function Input(msg) {
            node.log("Input called!");
            const dataPoint = {
                interval: {
                    endTime: {
                        seconds: Date.now() / 1000,
                    },
                },
                value: {
                    doubleValue: 0,
                },
            };
              
            dataPoint.value.doubleValue = msg.payload; // should be double/numeric

            const timeSeriesData = {
                metric: {
                    type: metricType, // metricType comes from the config parameters.
                },
                resource: {
                    type: 'global'
                },
                points: [dataPoint],
            };

            const writeRequest = {
                "name": metricServiceClient.projectPath(projectId),
                "timeSeries": [timeSeriesData]
            };
            try {
                await metricServiceClient.createTimeSeries(writeRequest);
                node.send(msg);
            } catch(err) {
                node.error(err);
            }
        } // Input

        if (credentials) {
            metricServiceClient = new monitoring.MetricServiceClient({
                "credentials": credentials
            });
        } else {
            node.error('missing credentials');
        }
        node.on('input', Input);
    } // MonitoringNode

    RED.nodes.registerType(NODE_TYPE, MonitoringNode);
};