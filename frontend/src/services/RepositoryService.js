import axios from 'axios';
import { URL } from '../constants/constants';

export class RepositoryService {
    constructor() {
        var headers = {
            'X-Custom-Header': 'Mono2Micro',
        };

        this.axios = axios.create({
            baseURL: URL,
            timeout: 10000,
            headers: headers,
        });
    }

    // Graphs
    getGraphs() {
        return this.axios.get("/graphs");
    }

    getGraph(name) {
        return this.axios.get("/graph/" + name);
    }

    loadGraph(name) {
        return this.axios.post("/load", 
            {
                "name" : name
            });
    }

    createDendrogram(dataFile) {
        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        }
        return this.axios.post("/createDendrogram", dataFile, config);
    }

    deleteGraph(name) {
        return this.axios.delete(name);
    }

    loadDendrogram() {
        return this.axios.get("/loadDendrogram");
    }

    cutDendrogram(cutValue) {
        return this.axios.get("/cutDendrogram", 
            {
                params: {
                    "cutValue" : cutValue
                }
            });
    }

    mergeClusters(graphName, cluster1, cluster2, newName) {
        return this.axios.get("/mergeClusters", 
            {
                params: {
                    "graphName" : graphName,
                    "cluster1" : cluster1,
                    "cluster2" : cluster2,
                    "newName" : newName
                }
            });
    }

    renameCluster(graphName, clusterName, newName) {
        return this.axios.get("/renameCluster", 
            {
                params: {
                    "graphName" : graphName,
                    "clusterName" : clusterName,
                    "newName" : newName
                }
            });
    }

    renameGraph(graphName, newName) {
        return this.axios.get("/renameGraph", 
            {
                params: {
                    "graphName" : graphName,
                    "newName" : newName
                }
            });
    }

    splitCluster(graphName, clusterName, newName, entitiesToExtract) {
        return this.axios.get("/splitCluster", 
            {
                params: {
                    "graphName" : graphName,
                    "clusterName" : clusterName,
                    "newName" : newName,
                    "entities" : entitiesToExtract
                }
            });
    }

    getControllerClusters(graphName) {
        return this.axios.get("/getControllerClusters", 
            {
                params: {
                    "graphName" : graphName
                }
            });
    }

    getControllers() {
        return this.axios.get("/getControllers");
    }

    transferEntities(graphName, fromCluster, toCluster, entities) {
        return this.axios.get("/transferEntities", 
            {
                params: {
                    "graphName" : graphName,
                    "fromCluster" : fromCluster,
                    "toCluster" : toCluster,
                    "entities" : entities
                }
            });
    }
 }