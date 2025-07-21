package com.ftb.api.service;

import com.ftb.api.dto.request.UpdateCartRequest;
import com.ftb.api.dto.response.CartResponseDto;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.mapper.CartMapper;
import com.ftb.api.model.*;
import com.ftb.api.repository.CartRepository;
import com.ftb.api.repository.ProductRepository;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartMapper cartMapper;

    @Transactional
    public CartResponseDto getCartForBuyer(String buyerEmail) {
        User buyer = findUserByEmail(buyerEmail);
        Cart cart = getOrCreateCartForBuyer(buyer);
        return cartMapper.toCartResponseDto(cart);
    }

    @Transactional
    public CartResponseDto addItemToCart(String buyerEmail, UpdateCartRequest request) {
        User buyer = findUserByEmail(buyerEmail);
        Cart cart = getOrCreateCartForBuyer(buyer);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (product.getListingStatus() != ProductStatus.ACTIVE) {
            throw new InvalidRequestException("Product is not active and cannot be added to the cart.");
        }

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(request.getProductId()))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(request.getQuantity());
        } else {
            CartItem newItem = new CartItem();
            newItem.setProduct(product);
            newItem.setQuantity(request.getQuantity());
            newItem.setPriceCentsAtAdd(product.getPrice().movePointRight(2).intValue());
            cart.addItem(newItem);
        }

        return cartMapper.toCartResponseDto(cartRepository.save(cart));
    }

    @Transactional
    public CartResponseDto removeItemFromCart(String buyerEmail, UUID productId) {
        User buyer = findUserByEmail(buyerEmail);
        Cart cart = getOrCreateCartForBuyer(buyer);

        cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .ifPresent(cart::removeItem);

        return cartMapper.toCartResponseDto(cartRepository.save(cart));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    private Cart getOrCreateCartForBuyer(User buyer) {
        return cartRepository.findByBuyerId(buyer.getId()).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setBuyer(buyer);
            return cartRepository.save(newCart);
        });
    }
}