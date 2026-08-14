package com.Orvixa.Orvixa.controller;

import com.Orvixa.Orvixa.dto.AuthResponse;
import com.Orvixa.Orvixa.dto.LoginRequest;
import com.Orvixa.Orvixa.dto.SignupRequest;
import com.Orvixa.Orvixa.model.User;
import com.Orvixa.Orvixa.repository.UserRepository;
import com.Orvixa.Orvixa.service.FaceMatchService;
import com.Orvixa.Orvixa.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FaceMatchService faceMatchService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          FaceMatchService faceMatchService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.faceMatchService = faceMatchService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        if (request.getFaceDescriptor() != null) {
            Optional<User> matchingUser = faceMatchService.findMatchingUser(request.getFaceDescriptor());
            if (matchingUser.isPresent()) {
                return ResponseEntity.badRequest().body(
                        "This face is already registered with a different account. " +
                        "Each face can only be linked to one account."
                );
            }
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(request.getEmail(), hashedPassword, request.getFullName());
        user.setFaceDescriptor(request.getFaceDescriptor());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getFullName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        if (user.getFaceDescriptor() != null && request.getFaceDescriptor() != null) {
            boolean faceMatches = faceMatchService.isMatch(user.getFaceDescriptor(), request.getFaceDescriptor());
            if (!faceMatches) {
                return ResponseEntity.status(401).body("Face verification failed");
            }
        }

        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getFullName()));
    }
}
