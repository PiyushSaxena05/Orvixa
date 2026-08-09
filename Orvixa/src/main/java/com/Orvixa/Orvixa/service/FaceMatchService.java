package com.Orvixa.Orvixa.service;

import org.springframework.stereotype.Service;

@Service
public class FaceMatchService {

    private static final double MATCH_THRESHOLD = 0.5;

    public boolean isMatch(String storedDescriptorJson, String candidateDescriptorJson) {
        double[] stored = parseDescriptor(storedDescriptorJson);
        double[] candidate = parseDescriptor(candidateDescriptorJson);

        if (stored.length != candidate.length) {
            return false;
        }

        double sumSquaredDiff = 0;
        for (int i = 0; i < stored.length; i++) {
            double diff = stored[i] - candidate[i];
            sumSquaredDiff += diff * diff;
        }

        double distance = Math.sqrt(sumSquaredDiff);
        return distance < MATCH_THRESHOLD;
    }

    private double[] parseDescriptor(String json) {
        String cleaned = json.replace("[", "").replace("]", "").trim();
        String[] parts = cleaned.split(",");
        double[] result = new double[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Double.parseDouble(parts[i].trim());
        }
        return result;
    }
}
