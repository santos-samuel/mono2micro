package collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.commons.io.FileUtils;
import spoon.DecompiledResource;
import spoon.Launcher;
import spoon.MavenLauncher;
import spoon.reflect.code.CtAbstractInvocation;
import spoon.reflect.cu.SourcePosition;
import spoon.reflect.declaration.*;
import spoon.reflect.factory.Factory;
import spoon.reflect.visitor.filter.TypeFilter;
import util.Constants;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.annotation.Annotation;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.*;

public abstract class SpoonCollector {
    private int controllerCount;
    private JsonObject callSequence;
    private String projectName;
    boolean collectionFlag;

    // all project classes
    ArrayList<String> allEntities;

    // in FenixFramework: allDomainEntities = all classes that extend .*_Base
    // in JPA: allDomainEntities = all @Entities @Embeddable @MappedSuperClass
    ArrayList<String> allDomainEntities;

    HashSet<CtClass> controllers;
    Map<SourcePosition, List<CtAbstractInvocation>> methodCallees;
    private JsonArray entitiesSequence;
    Map<String, List<CtType>> interfaces;

    Factory factory;
    Launcher launcher;

    HashMap<String, MethodContainer> methodsListCollection = new HashMap<>();

    /* ------- TO REMOVE ----------- */
    int repositoryCount = 0;
    int controllerMethodsCount = 0;

    SpoonCollector(int launcherChoice, String repoName, String projectPath, boolean collectionFlag) throws IOException {
        File decompiledDir = new File(Constants.DECOMPILED_SOURCES_PATH);
        if (decompiledDir.exists()) {
            FileUtils.deleteDirectory(decompiledDir);
        }

        callSequence = new JsonObject();
        controllers = new HashSet<>();
        allEntities = new ArrayList<>();
        allDomainEntities = new ArrayList<>();
        methodCallees = new HashMap<>();
        interfaces = new HashMap<>();

        this.projectName = repoName;
        this.collectionFlag = collectionFlag;

        switch (launcherChoice) {
            case Constants.LAUNCHER:
                launcher = new Launcher();
                launcher.addInputResource(projectPath);
                break;

            case Constants.MAVEN_LAUNCHER:
                launcher = new MavenLauncher(projectPath, MavenLauncher.SOURCE_TYPE.APP_SOURCE);
                break;

            case Constants.JAR_LAUNCHER:
                launcher = new Launcher();
                File projectDir = new File(projectPath);
                String[] extensions = new String[]{"jar"};
                Collection<File> packageFiles = FileUtils.listFiles(
                        projectDir,
                        extensions,
                        true
                );

                for (File packageFile : packageFiles) {
                    String packagePath = packageFile.getPath();
                    String decompiledPackageSourcesDir = Constants.DECOMPILED_SOURCES_PATH
                            + packagePath.substring(packagePath.lastIndexOf("/")+1)
                            + File.separator;
                    new File(decompiledPackageSourcesDir).mkdirs();

                    new DecompiledResource(
                            packagePath,
                            null,
                            null,
                            decompiledPackageSourcesDir
                    );
                    launcher.addInputResource(decompiledPackageSourcesDir);
                }
                break;
            default:
                System.exit(1);
                break;
        }

        launcher.getEnvironment().setIgnoreDuplicateDeclarations(true);
        launcher.getEnvironment().setCommentEnabled(false);
    }

    public void run() throws IOException {
        factory = launcher.getFactory();

        System.out.println("Processing Project: " + projectName);
        long startTime = System.currentTimeMillis();
        collectControllersAndEntities();

        controllerCount = 0;
        for (CtClass controller : controllers) {
            controllerCount++;
            processController(controller);
        }


        long elapsedTimeMillis = System.currentTimeMillis() - startTime;
        float elapsedTimeSec = elapsedTimeMillis/1000F;
        System.out.println("Complete. Elapsed time: " + elapsedTimeSec + " seconds");

        String fileName = projectName + ".json";
        storeJsonFile(Constants.COLLECTION_SAVE_PATH, fileName, callSequence);

        File file = new File(Constants.DECOMPILED_SOURCES_PATH);
        if (file.exists()) {
            FileUtils.deleteDirectory(file);
        }


        if (collectionFlag) {
            try {
                File methodsFile = new File(Constants.COLLECTION_SAVE_PATH, projectName + "_methods.json");
                new ObjectMapper().writerWithDefaultPrettyPrinter().writeValue(methodsFile, methodsListCollection);
                System.out.println("File '" + methodsFile.getName() + "' created at: " + methodsFile.getAbsolutePath());

                HashMap<String, Boolean> allEntitiesHashMap = new HashMap<>();
                allDomainEntities.forEach(e -> allEntitiesHashMap.put(e, true));
                File entitiesFile = new File(Constants.COLLECTION_SAVE_PATH, projectName + "_allEntities.json");
                new ObjectMapper().writerWithDefaultPrettyPrinter().writeValue(entitiesFile, allEntitiesHashMap);
                System.out.println("File '" + entitiesFile.getName() + "' created at: " + entitiesFile.getAbsolutePath());
            } catch (Exception e) {
                System.err.println("Couldn't write collection file(s).");
            }
        }

        /* ------ TO REMOVE ------- */
        File testData = new File(Constants.TEST_DATA_PATH);
        if (!testData.exists()) testData.createNewFile();
        String s0 = "Project: " + projectName;
        String s1 = "#Controllers: " + controllers.size();
        String s15 = "#ControllerMethods: " + controllerMethodsCount;
        String s2 = "#Entities: " + allEntities.size();
        String s3 = "#DomainEntities: " + allDomainEntities.size();
        String s4 = "#Repositories: " + repositoryCount;
        StringBuilder sb = new StringBuilder()
                .append("---------------------------\n")
                .append(s0)
                .append("\n")
                .append(s1)
                .append("\n")
                .append(s15)
                .append("\n")
                .append(s2)
                .append("\n")
                .append(s3)
                .append("\n")
                .append(s4)
                .append("\n");
        Files.write(Paths.get(testData.getPath()), sb.toString().getBytes(), StandardOpenOption.APPEND);
        System.exit(1);
    }

    private void processController(CtClass controller) {
        for (Object cM : controller.getMethods()) {
            CtMethod controllerMethod = (CtMethod) cM;

            //Check if the controller method return type == ActionForward
            if (controller.getSuperclass() != null && controller.getSuperclass().getSimpleName().contains("DispatchAction")) {
                if (!controllerMethod.getType().toString().contains("ActionForward"))
                    continue;
            } else {
                List<CtAnnotation<? extends Annotation>> annotations = controllerMethod.getAnnotations();
                if (!existsAnnotation(annotations, "RequestMapping") &&
                    !existsAnnotation(annotations, "GetMapping") &&
                    !existsAnnotation(annotations, "PostMapping") &&
                    !existsAnnotation(annotations, "PatchMapping") &&
                    !existsAnnotation(annotations, "PutMapping") &&
                    !existsAnnotation(annotations, "DeleteMapping")
                ) {
                    continue;
                }
            }

            String controllerFullName = controller.getSimpleName() + "." + controllerMethod.getSimpleName();
            System.out.println("Processing Controller: " + controllerFullName + "   " + controllerCount + "/" + controllers.size());
            entitiesSequence = new JsonArray();
            Stack<SourcePosition> methodStack = new Stack<>();

            controllerMethodsCount++;
            methodCallDFS(controllerMethod, null, methodStack);

            if (entitiesSequence.size() > 0) {
                callSequence.add(controller.getSimpleName() + "." + controllerMethod.getSimpleName(), entitiesSequence);
            }
        }
    }

    abstract void methodCallDFS(CtExecutable callerMethod, CtAbstractInvocation prevCalleeLocation, Stack<SourcePosition> methodStack);

    abstract void collectControllersAndEntities();

    List<CtAbstractInvocation> getCalleesOf(CtExecutable method) {
        Map<Integer,CtAbstractInvocation> orderedCallees = new TreeMap<>();
        List<CtAbstractInvocation> methodCalls = method.getElements(new TypeFilter<>(CtAbstractInvocation.class));
        for (CtAbstractInvocation i : methodCalls)
            try {
                orderedCallees.put(i.getPosition().getSourceEnd(), i);
            } catch (Exception ignored) {} // "super" fantasmas em construtores
        return new ArrayList<>(orderedCallees.values()); // why are we ordering the calls?
    }

    boolean existsAnnotation(List<CtAnnotation<? extends Annotation>> annotations, String annotationName) {
        for (CtAnnotation<? extends Annotation> a : annotations) {
            if ( a.getAnnotationType().getSimpleName().equals(annotationName) )
                return true;
        }
        return false;
    }

    private void storeJsonFile(String filepath, String fileName, JsonObject callSequence) {
        try {
            File filePath = new File(filepath);
            if (!filePath.exists()) {
                filePath.mkdirs();
            }

            FileWriter file = new FileWriter(new File(filePath, fileName));
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            file.write(gson.toJson(callSequence));
            file.close();

            System.out.println("File '" + fileName + "' created at: " + filepath);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    void addEntitiesSequenceAccess(String simpleName, String mode) {
        JsonArray entityAccess = new JsonArray();
        entityAccess.add(simpleName);
        entityAccess.add(mode);
        entitiesSequence.add(entityAccess);
    }
}
