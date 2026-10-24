package com.ftb.api.util;

import java.security.SecureRandom;


/** Generates short, readable order numbers such as CM-7K3F9Q2X (Crockford base32: no I, L, O or U). */
public final class OrderNumbers {

    private static final char[] ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int LENGTH = 8;

    private OrderNumbers() {
    }

    /** 8 random base32 characters: about a trillion combinations, so collisions are very rare (and retried). */
    public static String next() {
        StringBuilder number = new StringBuilder("CM-");
        for (int i = 0; i < LENGTH; i++) {
            number.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return number.toString();
    }
}
