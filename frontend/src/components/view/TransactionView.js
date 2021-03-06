import React from 'react';
import { TransactionOperationsMenu } from './TransactionOperationsMenu';
import { RepositoryService } from '../../services/RepositoryService';
import { VisNetwork } from '../util/VisNetwork';
import { DataSet } from 'vis';
import { views, types } from './Views';
import BootstrapTable from 'react-bootstrap-table-next';
import { Button, ButtonGroup} from 'react-bootstrap';


export const transactionViewHelp = (<div>
    Hover or double click cluster to see entities inside.<br />
    Hover or double click controller to see entities accessed.<br />
    Hover or double click edge to see entities accessed in a cluster.<br />
    </div>);

const options = {
    height: "700",
    layout: {
        hierarchical: {
            direction: 'UD',
            nodeSpacing: 120
        }
    },
    edges: {
        smooth: false,
        arrows: {
          to: {
            enabled: true,
          }
        },
        scaling: {
            label: {
                enabled: true
            },
        },
        color: {
            color: "#2B7CE9",
            hover: "#2B7CE9",
            highlight: "#FFA500"
        }
    },
    nodes: {
        shape: 'ellipse',
        scaling: {
            label: {
                enabled: true
            },
        },
        color: {
            border: "#2B7CE9",
            background: "#D2E5FF",
            highlight: {
                background: "#FFA500",
                border: "#FFA500"
            }
        }
    },
    interaction: {
        hover: true
    },
    physics: {
        enabled: false
    }
};

const optionsSeq = {
    height: "700",
    layout: {
        hierarchical: {
            direction: 'UD',
            nodeSpacing: 200
        }
    },
    edges: {
        smooth: false,
        arrows: {
          to: {
            enabled: true,
          }
        },
        scaling: {
            label: {
                enabled: true
            },
        },
        color: {
            color: "#2B7CE9",
            hover: "#2B7CE9",
            highlight: "#FFA500"
        }
    },
    nodes: {
        shape: 'ellipse',
        scaling: {
            label: {
                enabled: true
            },
        },
        color: {
            border: "#2B7CE9",
            background: "#D2E5FF",
            highlight: {
                background: "#FFA500",
                border: "#FFA500"
            }
        }
    },
    interaction: {
        hover: true
    },
    physics: {
        enabled: false
    }
};

export class TransactionView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            visGraph: {},
            visGraphSeq: {},
            graph: {},
            controller: {},
            controllers: [],
            controllerClusters: [],
            showGraph: false,
            clusterSequence: [],
            currentSubView: "Graph"
        }

        this.handleControllerSubmit = this.handleControllerSubmit.bind(this);
    }

    componentDidMount() {
        const service = new RepositoryService();
        service.getControllerClusters(this.props.codebaseName, this.props.dendrogramName, this.props.graphName).then(response => {
            this.setState({
                controllerClusters: response.data
            });
        });
        service.getGraph(this.props.codebaseName, this.props.dendrogramName, this.props.graphName).then(response => {
            this.setState({
                graph: response.data,
                controllers: response.data.controllers
            });
        });
    }

    handleControllerSubmit(value) {
        this.setState({
            controller: this.state.controllers.filter(c => c.name === value)[0],
        }, () => {
            this.loadGraph();
        });
    }

    loadGraph() {
        this.createTransactionDiagram();
        this.createSequenceDiagram();
        this.setState({
            showGraph: true
        });
    }

    createTransactionDiagram() {
        const visGraph = {
            nodes: new DataSet(this.state.controllerClusters[this.state.controller.name].map(cluster => this.createNode(cluster))),
            edges: new DataSet(this.state.controllerClusters[this.state.controller.name].map(cluster => this.createEdge(cluster)))
        };
        visGraph.nodes.add({
            id: this.state.controller.name, 
            title: Object.entries(this.state.controller.entities).map(e => e[0] + " " + e[1]).join('<br>') + "<br>Total: " + Object.keys(this.state.controller.entities).length,
            label: this.state.controller.name,
            level: 0,
            value: 1,
            type: types.CONTROLLER
        });

        this.setState({
            visGraph: visGraph
        });
    }

    createNode(cluster) {
        return {
            id: cluster.name, 
            title: cluster.entities.map(e => e.name).join('<br>') + "<br>Total: " + cluster.entities.length,
            label: cluster.name, 
            value: cluster.entities.length, 
            level: 1, 
            type: types.CLUSTER
        };
    }

    createEdge(cluster) {
        let entitiesTouched = Object.entries(this.state.controller.entities).filter(e => cluster.entities.map(e => e.name).includes(e[0])).map(e => e[0] + " " + e[1]);
        return {
            from: this.state.controller.name, 
            to: cluster.name, 
            label: entitiesTouched.length.toString(), 
            title: entitiesTouched.join('<br>')
        };
    }

    createSequenceDiagram() {
        let nodes = [];
        let edges = [];
        let clusterSequence = [];

        nodes.push({
            id: 0,
            title: Object.entries(this.state.controller.entities).map(e => e[0] + " " + e[1]).join('<br>') + "<br>Total: " + Object.keys(this.state.controller.entities).length, 
            label: this.state.controller.name, 
            level: 0, 
            value: 1, 
            type: types.CONTROLLER
        });

        let entitiesSequence = JSON.parse(this.state.controller.entitiesSeq);

        for (var i = 0; i < entitiesSequence.length; i++) {
            let clusterName = entitiesSequence[i]["cluster"];
            let cluster = this.state.graph.clusters.filter(cluster => cluster.name === clusterName)[0];
            let nodeId = i+1;

            nodes.push({
                id: nodeId, 
                title: cluster.entities.map(e => e.name).join('<br>') + "<br>Total: " + cluster.entities.length, 
                label: cluster.name, 
                value: cluster.entities.length, 
                level: 1, 
                type: types.CLUSTER
            });

            let entitiesTouched = entitiesSequence[i]["sequence"];

            edges.push({
                from: nodeId - 1, 
                to: nodeId,
                title: Object.values(entitiesTouched).map(e => e.join(" ")).join('<br>'), 
                label: entitiesTouched.length.toString()
            });

            clusterSequence.push({
                id: nodeId, 
                cluster: cluster.name, 
                entities: <pre>{Object.values(entitiesTouched).map(e => e.join(" ")).join('\n')}</pre>
            });
        }

        const visGraphSeq = {
            nodes: new DataSet(nodes),
            edges: new DataSet(edges)
        };

        this.setState({
            visGraphSeq: visGraphSeq,
            clusterSequence: clusterSequence
        });
    }

    handleSelectNode(nodeId) {

    }

    handleDeselectNode(nodeId) {

    }

    changeSubView(value) {
        this.setState({
            currentSubView: value
        });
    }

    render() {
        const metricsRows = this.state.controllers.map(controller => {
            return {
                controller: controller.name,
                clusters: this.state.controllerClusters[controller.name] === undefined ? 0 : this.state.controllerClusters[controller.name].length,
                complexity: controller.complexity
            }
        });

        const metricsColumns = [{
            dataField: 'controller',
            text: 'Controller',
            sort: true
        }, {
            dataField: 'clusters',
            text: '# of Clusters Accessed',
            sort: true
        }, {
            dataField: 'complexity',
            text: 'Complexity',
            sort: true
        }];

        const seqColumns = [{
            dataField: 'id',
            text: 'Order'
        }, {
            dataField: 'cluster',
            text: 'Cluster Accessed'
        }, {
            dataField: 'entities',
            text: 'Entities Accessed'
        }];

        let controllerClustersAmount = Object.keys(this.state.controllerClusters).map(controller => this.state.controllerClusters[controller].length);
        let averageClustersAccessed = controllerClustersAmount.reduce((a,b) => a + b, 0) / controllerClustersAmount.length;

        return (
            <div>
                <ButtonGroup className="mb-2">
                    <Button disabled={this.state.currentSubView === "Graph"} onClick={() => this.changeSubView("Graph")}>Graph</Button>
                    <Button disabled={this.state.currentSubView === "Sequence Graph"} onClick={() => this.changeSubView("Sequence Graph")}>Sequence Graph</Button>
                    <Button disabled={this.state.currentSubView === "Metrics"} onClick={() => this.changeSubView("Metrics")}>Metrics</Button>
                    <Button disabled={this.state.currentSubView === "Sequence Table"} onClick={() => this.changeSubView("Sequence Table")}>Sequence Table</Button>
                </ButtonGroup>
                
                {this.state.currentSubView === "Graph" &&
                    <span>
                        <TransactionOperationsMenu
                            handleControllerSubmit={this.handleControllerSubmit}
                            controllerClusters={this.state.controllerClusters}
                        />
                        <div style={{width:'1000px' , height: '700px'}}>
                            <VisNetwork 
                                visGraph={this.state.visGraph}
                                options={options}
                                onSelection={this.handleSelectNode}
                                onDeselection={this.handleDeselectNode}
                                view={views.TRANSACTION} />
                        </div>
                    </span>
                }

                {this.state.currentSubView === "Sequence Graph" &&
                    <div style={{width:'1000px' , height: '700px'}}>
                        <VisNetwork
                            visGraph={this.state.visGraphSeq}
                            options={optionsSeq}
                            onSelection={this.handleSelectNode}
                            onDeselection={this.handleDeselectNode}
                            view={views.TRANSACTION} />
                    </div>
                }

                {this.state.currentSubView === "Metrics" &&
                    <div>
                        Number of Clusters : {this.state.graph.clusters.length}< br/>
                        Number of Controllers that access a single Cluster : {Object.keys(this.state.controllerClusters).filter(key => this.state.controllerClusters[key].length === 1).length}< br/>
                        Maximum number of Clusters accessed by a single Controller : {Math.max(...Object.keys(this.state.controllerClusters).map(key => this.state.controllerClusters[key].length))}< br/>
                        Average Number of Clusters accessed (Average number of microservices accessed during a transaction) : {Number(averageClustersAccessed.toFixed(2))}
                        <BootstrapTable bootstrap4 keyField='controller' data={ metricsRows } columns={ metricsColumns } />
                    </div>
                }

                {this.state.showGraph && this.state.currentSubView === "Sequence Table" &&
                    <div>
                        <h4>{this.state.controller.name}</h4>
                        <BootstrapTable bootstrap4 keyField='id' data={ this.state.clusterSequence } columns={ seqColumns } />
                    </div>
                }
            </div>
        );
    }
}