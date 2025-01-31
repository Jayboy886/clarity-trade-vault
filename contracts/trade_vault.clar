;; TradeVault Contract
;; Secure P2P Trading Platform

;; Constants
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_STATUS (err u101))
(define-constant ERR_LISTING_NOT_FOUND (err u102))
(define-constant ERR_OFFER_NOT_FOUND (err u103))
(define-constant ERR_ALREADY_COMPLETED (err u104))

;; Data Variables
(define-data-var next-listing-id uint u0)
(define-data-var next-offer-id uint u0)

;; Data Maps
(define-map Listings
    uint 
    {
        owner: principal,
        item-id: uint,
        description: (string-ascii 256),
        status: (string-ascii 20)
    }
)

(define-map Offers
    uint
    {
        listing-id: uint,
        from: principal,
        offer-item-id: uint,
        status: (string-ascii 20)
    }
)

(define-map UserTrades
    principal
    (list 50 uint)
)

;; Public Functions

;; Create a new listing
(define-public (create-listing (item-id uint) (description (string-ascii 256)))
    (let
        (
            (listing-id (var-get next-listing-id))
        )
        (map-set Listings listing-id {
            owner: tx-sender,
            item-id: item-id,
            description: description,
            status: "active"
        })
        (var-set next-listing-id (+ listing-id u1))
        (ok listing-id)
    )
)

;; Make an offer on a listing
(define-public (make-offer (listing-id uint) (offer-item-id uint))
    (let
        (
            (offer-id (var-get next-offer-id))
            (listing (unwrap! (map-get? Listings listing-id) ERR_LISTING_NOT_FOUND))
        )
        (asserts! (is-eq (get status listing) "active") ERR_INVALID_STATUS)
        (asserts! (not (is-eq (get owner listing) tx-sender)) ERR_UNAUTHORIZED)
        (map-set Offers offer-id {
            listing-id: listing-id,
            from: tx-sender,
            offer-item-id: offer-item-id,
            status: "pending"
        })
        (var-set next-offer-id (+ offer-id u1))
        (ok offer-id)
    )
)

;; Accept an offer
(define-public (accept-offer (offer-id uint))
    (let
        (
            (offer (unwrap! (map-get? Offers offer-id) ERR_OFFER_NOT_FOUND))
            (listing (unwrap! (map-get? Listings (get listing-id offer)) ERR_LISTING_NOT_FOUND))
        )
        (asserts! (is-eq tx-sender (get owner listing)) ERR_UNAUTHORIZED)
        (asserts! (is-eq (get status offer) "pending") ERR_INVALID_STATUS) 
        (asserts! (is-eq (get status listing) "active") ERR_ALREADY_COMPLETED)
        
        ;; Update offer status
        (map-set Offers offer-id (merge offer { status: "accepted" }))
        
        ;; Update listing status
        (map-set Listings (get listing-id offer) (merge listing { status: "completed" }))
        
        ;; Record trade in history
        (add-trade-to-history tx-sender (get listing-id offer))
        (add-trade-to-history (get from offer) (get listing-id offer))
        
        (ok true)
    )
)

;; Reject an offer
(define-public (reject-offer (offer-id uint))
    (let
        (
            (offer (unwrap! (map-get? Offers offer-id) ERR_OFFER_NOT_FOUND))
            (listing (unwrap! (map-get? Listings (get listing-id offer)) ERR_LISTING_NOT_FOUND))
        )
        (asserts! (is-eq tx-sender (get owner listing)) ERR_UNAUTHORIZED)
        (asserts! (is-eq (get status offer) "pending") ERR_INVALID_STATUS)
        (asserts! (is-eq (get status listing) "active") ERR_ALREADY_COMPLETED)
        (map-set Offers offer-id (merge offer { status: "rejected" }))
        (ok true)
    )
)

;; Private Functions

;; Add trade to user's history
(define-private (add-trade-to-history (user principal) (listing-id uint))
    (let
        (
            (current-history (default-to (list) (map-get? UserTrades user)))
        )
        (map-set UserTrades 
            user 
            (unwrap! (as-max-len? (append current-history listing-id) u50) ERR_UNAUTHORIZED))
    )
)

;; Read Only Functions

(define-read-only (get-listing (listing-id uint))
    (map-get? Listings listing-id)
)

(define-read-only (get-offer (offer-id uint))
    (map-get? Offers offer-id)
)

(define-read-only (get-user-trade-history (user principal))
    (default-to (list) (map-get? UserTrades user))
)
