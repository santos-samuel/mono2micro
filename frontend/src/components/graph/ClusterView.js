import React from 'react';
import { RepositoryService } from '../../services/RepositoryService';
import { ClusterOperationsMenu, operations } from './ClusterOperationsMenu';
import { VisNetwork } from '../util/VisNetwork';
import { ModalMessage } from '../util/ModalMessage';
import { DataSet } from 'vis';
import { views, types } from './ViewsMenu';
import { Table } from 'react-bootstrap';

export const clusterViewHelp = (<div>
    Hover or double click cluster to see entities inside.<br />
    Hover or double click edge to see controllers in common.<br />
    Select cluster or edge for highlight and to open operation menu.
    </div>);

const options = {
    height: "700",
    layout: {
        hierarchical: false
    },
    edges: {
        smooth: false,
        width: 0.5,
        arrows: {
          from: {
            enabled: false,
            scaleFactor: 0.5
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
        enabled: true,
        hierarchicalRepulsion: {
            centralGravity: 0.0,
            springLength: 500,
            springConstant: 0.01,
            nodeDistance: 100,
            damping: 0.09
        },
        solver: 'hierarchicalRepulsion'
    },
};

export class ClusterView extends React.Component {
    constructor(props) {
        super(props);

         this.state = {
            visGraph: {},
            clusters: [],
            showMenu: false,
            selectedCluster: {},
            mergeWithCluster: {},
            transferToCluster: {},
            clusterEntities: [],
            error: false,
            errorMessage: '',
            operation: operations.NONE
        };

        this.loadGraph = this.loadGraph.bind(this);
        this.convertClusterToNode = this.convertClusterToNode.bind(this);
        this.createEdges = this.createEdges.bind(this);
        this.setClusterEntities = this.setClusterEntities.bind(this);
        this.handleSelectOperation = this.handleSelectOperation.bind(this);
        this.handleSelectCluster = this.handleSelectCluster.bind(this);
        this.handleSelectEntity = this.handleSelectEntity.bind(this);
        this.handleOperationSubmit = this.handleOperationSubmit.bind(this);
        this.handleOperationCancel = this.handleOperationCancel.bind(this);
        this.closeErrorMessageModal = this.closeErrorMessageModal.bind(this);

    }

    loadGraph() {
        const service = new RepositoryService();
        service.getClusterControllers(this.props.dendrogramName, this.props.graphName).then(response1 => {
            service.getGraph(this.props.dendrogramName, this.props.graphName).then(response2 => {

                const visGraph = {
                    nodes: new DataSet(response2.data.clusters.map(cluster => this.convertClusterToNode(cluster))),
                    edges: new DataSet(this.createEdges(response2.data.clusters, response1.data))
                };

                this.setState({
                    visGraph: visGraph,
                    clusters: response2.data.clusters,
                    showMenu: false,
                    selectedCluster: {},
                    mergeWithCluster: {},
                    transferToCluster: {},
                    clusterEntities: [],
                    operation: operations.NONE
                });
            });
        });
    }

    createEdges(clusters, clusterControllers) {
        let edges = [];
        let edgeLengthFactor = 1000;

        for (var i = 0; i < clusters.length; i++) { 
            let cluster1Controllers = clusterControllers[clusters[i].name].map(c => c.name);
            for (var j = i+1; j < clusters.length; j++) {
                let cluster2Controllers = clusterControllers[clusters[j].name].map(c => c.name);
                let controllersInCommon = cluster1Controllers.filter(value => -1 !== cluster2Controllers.indexOf(value))

                let edgeTitle = clusters[i].name + " -- " + clusters[j].name + "<br>";
                let edgeLength = (1/controllersInCommon.length)*edgeLengthFactor;
                if (edgeLength < 100) edgeLength = 300;
                else if (edgeLength > 500) edgeLength = 500;
                if (controllersInCommon.length > 0)
                    //edges.push({from: clusters[i].name, to: clusters[j].name, value: ControllersInCommon.length, label: ControllersInCommon.length.toString(), title: edgeTitle + ControllersInCommon.join('<br>')});
                    edges.push({from: clusters[i].name, to: clusters[j].name, length:edgeLength, value: controllersInCommon.length, label: controllersInCommon.length.toString(), title: edgeTitle + controllersInCommon.join('<br>')});
                //else
                    //edges.push({from: clusters[i].name, to: clusters[j].name, length:(1/0.5)*edgeLengthFactor, hidden: true});
            }
        }
        return edges;
    }

    convertClusterToNode(cluster) {
        return {id: cluster.name, title: cluster.entities.join('<br>'), label: cluster.name, value: cluster.entities.length, type: types.CLUSTER};
    };

    setClusterEntities(selectedCluster) {
        this.setState({
            selectedCluster: selectedCluster,
            mergeWithCluster: {},
            clusterEntities: selectedCluster.entities.map(e => ({name: e, active: false})),
        });
    }

    componentDidMount() {
        this.loadGraph();
    }

    handleSelectOperation(operation) {
        if (operation === operations.SPLIT || operation === operations.TRANSFER) {
            this.setClusterEntities(this.state.selectedCluster);
            this.setState({
                operation: operation
            });
        } else {
            this.setState({ 
                mergeWithCluster: {},
                transferToCluster: {},
                clusterEntities: [],
                operation: operation 
            });
        }
    }

    handleSelectCluster(nodeId) {
        if (this.state.operation === operations.NONE ||
            this.state.operation === operations.RENAME) {
            this.setState({
                showMenu: true,
                selectedCluster: this.state.clusters.find(c => c.name === nodeId)
            });
        }

        if (this.state.operation === operations.MERGE) {
            const mergeWithCluster = this.state.clusters.find(c => c.name === nodeId);
            if (this.state.selectedCluster === mergeWithCluster) {
                this.setState({
                    error: true,
                    errorMessage: 'Cannot merge a cluster with itself'
                });
            } else {
                this.setState({
                    mergeWithCluster: mergeWithCluster
                });
            }
        }

        if (this.state.operation === operations.TRANSFER) {
            const transferToCluster = this.state.clusters.find(c => c.name === nodeId);
            if (this.state.selectedCluster === transferToCluster) {
                this.setState({
                    error: true,
                    errorMessage: 'Cannot transfer entities to the same cluster'
                });
            } else {
                this.setState({
                    transferToCluster: transferToCluster
                });
            }
        }

        if (this.state.operation === operations.SPLIT) {
            this.setClusterEntities(this.state.clusters.find(c => c.name  === nodeId));
        }
    }

    handleSelectEntity(entityName) {
        const clusterEntities = this.state.clusterEntities.map(e => {
            if (e.name === entityName) {
                return {...e, active: !e.active};
            } else {
                return e;
            }
        });
        this.setState({
            clusterEntities: clusterEntities
        });
    }

    handleOperationSubmit(operation, inputValue) {
        const service = new RepositoryService();
        switch (operation) {
            case operations.RENAME:
                service.renameCluster(this.props.dendrogramName, this.props.graphName, this.state.selectedCluster.name, inputValue)
                .then(() => {
                    this.loadGraph();        
                }).catch((err) => {
                    this.setState({
                        error: true,
                        errorMessage: 'ERROR: rename cluster failed.'
                    });
                });
                break;
            case operations.MERGE:
                service.mergeClusters(this.props.dendrogramName, this.props.graphName, this.state.selectedCluster.name, 
                    this.state.mergeWithCluster.name, inputValue)
                .then(() => {
                    this.loadGraph();        
                }).catch((err) => {
                    this.setState({
                        error: true,
                        errorMessage: 'ERROR: merge clusters failed.'
                    });
                });
                break;
            case operations.SPLIT:
                let activeClusterEntitiesSplit = this.state.clusterEntities.filter(e => e.active).map(e => e.name).toString();
                service.splitCluster(this.props.dendrogramName, this.props.graphName, this.state.selectedCluster.name, inputValue, activeClusterEntitiesSplit)
                .then(() => {
                    this.loadGraph();        
                }).catch((err) => {
                    this.setState({
                        error: true,
                        errorMessage: 'ERROR: split cluster failed.'
                    });
                });
                break;
            case operations.TRANSFER:
                let activeClusterEntitiesTransfer = this.state.clusterEntities.filter(e => e.active).map(e => e.name).toString();
                service.transferEntities(this.props.dendrogramName, this.props.graphName, this.state.selectedCluster.name, 
                    this.state.transferToCluster.name, activeClusterEntitiesTransfer)
                .then(() => {
                    this.loadGraph();        
                }).catch((err) => {
                    this.setState({
                        error: true,
                        errorMessage: 'ERROR: transfer entities failed.'
                    });
                });
                break;
            default:
        }
    }

    handleOperationCancel() {
        this.setState({ 
            showMenu: false,
            selectedCluster: {},
            mergeWithCluster: {},
            transferToCluster: {},
            clusterEntities: [],
            operation: operations.NONE 
        });
    }

    closeErrorMessageModal() {
        this.setState({
            error: false,
            errrorMessage: ''
        });
    }

    handleDeselectNode(nodeId) {

    }

    render() {
        const rows = this.state.clusters.map(c => 
            <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.complexity}</td>
                <td>{c.cohesion}</td>
                <td>{c.coupling}</td>
            </tr>
        );

        return (
            <div>                
                {this.state.error && 
                <ModalMessage
                    title='Error Message' 
                    message={this.state.errorMessage} 
                    onClose={this.closeErrorMessageModal} />}

                {this.state.showMenu &&
                <ClusterOperationsMenu
                    selectedCluster={this.state.selectedCluster}
                    mergeWithCluster={this.state.mergeWithCluster}
                    transferToCluster={this.state.transferToCluster}
                    clusterEntities={this.state.clusterEntities}
                    handleSelectOperation={this.handleSelectOperation}
                    handleSelectEntity={this.handleSelectEntity}
                    handleSubmit={this.handleOperationSubmit}
                    handleCancel={this.handleOperationCancel}
                />}

                <div style={{width:'1000px' , height: '700px'}}>
                    <VisNetwork 
                        visGraph={this.state.visGraph} 
                        clusters={this.state.clusters} 
                        options={options} 
                        onSelection={this.handleSelectCluster}
                        onDeselection={this.handleDeselectNode}
                        view={views.CLUSTERS} />
                </div>

                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Cluster</th>
                            <th>Complexity</th>
                            <th>Cohesion</th>
                            <th>Coupling</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </Table>
            </div>
        );
    }
}