package com.nextlead;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NextLeadApplication {
    public static void main(String[] args) {
        SpringApplication.run(NextLeadApplication.class, args);
    }
}
