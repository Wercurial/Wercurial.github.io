---
title: "maven编译将多个指定目录打包成jar"
date: 2024-03-12
description: "maven编译将多个指定目录打包成jar。"
tags: ["coding", "java", "language"]
type: 'blog'
---

# 1. pom配置
- maven编译将多个指定目录打包成jar
- maven编译将依赖jar打包到指定目录
- maven编译不编译默认的总jar
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <groupId>groupId</groupId>
    <artifactId>Test</artifactId>
    <version>1.0-SNAPSHOT</version>
    <modelVersion>4.0.0</modelVersion>

    <build>
        <!--        <sourceDirectory>core</sourceDirectory>-->
        <plugins>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>build-helper-maven-plugin</artifactId>
                <version>1.7</version>
                <executions>
                    <execution>
                        <id>add-source</id>
                        <phase>generate-sources</phase>
                        <goals>
                            <goal>add-source</goal>
                        </goals>
                        <configuration>
                            <sources>
                                <!-- 我们可以通过在这里添加多个source节点，来添加任意多个源文件夹 -->
                                <source>${basedir}/code1</source>
                                <source>${basedir}/code2</source>
                            </sources>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>8</source>
                    <target>8</target>
                </configuration>
            </plugin>
            <!-- 把依赖的jar包放入一个单独的目录中 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <executions>
                    <execution>
                        <id>copy-dependencies</id>
                        <!-- 这个阶段位于package阶段之前，你可以执行一些需要在打包之前完成的任务，例如生成或修改资源文件 -->
                        <phase>prepare-package</phase>
                        <goals>
                            <goal>copy-dependencies</goal>
                        </goals>
                        <configuration>
                            <outputDirectory>${project.build.directory}/code-lib</outputDirectory>
                            <overWriteReleases>false</overWriteReleases>
                            <overWriteSnapshots>false</overWriteSnapshots>
                            <overWriteIfNewer>true</overWriteIfNewer>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <executions>
                    <execution>
                        <id>default-jar</id>
                        <phase>none</phase> <!-- 禁用默认的 jar 执行 -->
                    </execution>
                </executions>
                <configuration>
                    <archive>
                        <manifest>
                            <addClasspath>true</addClasspath>
                            <classpathPrefix>lib/</classpathPrefix>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
            <plugin>
                <artifactId>maven-jar-plugin</artifactId>
                <executions>
                    <execution>
                        <id>code1</id>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                        <phase>package</phase>
                        <configuration>
                            <classifier>code1</classifier>
                            <includes>
                                <include>**/code1/**</include>  <!-- code1目录下的所有java文件 -->
                            </includes>
                        </configuration>
                    </execution>
                    <execution>
                        <id>code2</id>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                        <phase>package</phase>
                        <configuration>
                            <classifier>code2</classifier>
                            <includes>
                                <include>**/code2/t1/**</include>  <!-- code1目录下的t1下的所有java文件 -->
                                <include>**/code2/t2/**</include>  <!-- code1目录下的t2下的所有java文件 -->
                            </includes>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <!-- 添加一个自定义插件来重命名 JAR 文件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-antrun-plugin</artifactId>
                <executions>
                    <execution>
                        <id>rename-jars</id>
                        <phase>package</phase>
                        <goals>
                            <goal>run</goal>
                        </goals>
                        <configuration>
                            <tasks>
                                <move file="${project.build.directory}/${project.artifactId}-${project.version}-code1.jar"
                                      tofile="${project.build.directory}/code1.jar"/>
                                <move file="${project.build.directory}/${project.artifactId}-${project.version}-code2.jar"
                                      tofile="${project.build.directory}/code2.jar"/>
                            </tasks>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```