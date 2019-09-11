package pt.ist.socialsoftware.mono2micro.dto;

import java.util.ArrayList;
import java.util.List;

public class AnalysisDto {
    private String codebaseName;
    private String dendrogramName1;
    private String graphName1;
    private String dendrogramName2;
    private String graphName2;
    private int truePositive;
    private int trueNegative;
    private int falsePositive;
    private int falseNegative;
    private List<String[]> falsePairs = new ArrayList<>();
    private float accuracy;
    private float precision;
    private float recall;
    private float specificity;
    private float fmeasure;

    public float getPrecision() {
        return precision;
    }

    public String getCodebaseName() {
        return codebaseName;
    }

    public void setCodebaseName(String codebaseName) {
        this.codebaseName = codebaseName;
    }

    public float getSpecificity() {
        return specificity;
    }

    public void setSpecificity(float specificity) {
        this.specificity = specificity;
    }

    public float getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(float accuracy) {
        this.accuracy = accuracy;
    }

    public List<String[]> getFalsePairs() {
        return falsePairs;
    }

    public void setFalsePairs(List<String[]> falsePairs) {
        this.falsePairs = falsePairs;
    }

    public void addFalsePair(String[] falsePair) {
        this.falsePairs.add(falsePair);
    }

    public int getFalseNegative() {
        return falseNegative;
    }

    public void setFalseNegative(int falseNegative) {
        this.falseNegative = falseNegative;
    }

    public int getFalsePositive() {
        return falsePositive;
    }

    public void setFalsePositive(int falsePositive) {
        this.falsePositive = falsePositive;
    }

    public int getTrueNegative() {
        return trueNegative;
    }

    public void setTrueNegative(int trueNegative) {
        this.trueNegative = trueNegative;
    }

    public int getTruePositive() {
        return truePositive;
    }

    public void setTruePositive(int truePositive) {
        this.truePositive = truePositive;
    }

    public String getGraphName2() {
        return graphName2;
    }

    public void setGraphName2(String graphName2) {
        this.graphName2 = graphName2;
    }

    public String getDendrogramName2() {
        return dendrogramName2;
    }

    public void setDendrogramName2(String dendrogramName2) {
        this.dendrogramName2 = dendrogramName2;
    }

    public String getGraphName1() {
        return graphName1;
    }

    public void setGraphName1(String graphName1) {
        this.graphName1 = graphName1;
    }

    public String getDendrogramName1() {
        return dendrogramName1;
    }

    public void setDendrogramName1(String dendrogramName1) {
        this.dendrogramName1 = dendrogramName1;
    }

    public void setPrecision(float precision) {
        this.precision = precision;
    }

    public float getRecall() {
        return recall;
    }

    public void setRecall(float recall) {
        this.recall = recall;
    }

    public float getFmeasure() {
        return fmeasure;
    }

    public void setFmeasure(float fmeasure) {
        this.fmeasure = fmeasure;
    }
}