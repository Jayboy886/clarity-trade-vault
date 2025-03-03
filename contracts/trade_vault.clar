;; TradeVault Contract
;; Secure P2P Trading Platform

;; Error Constants
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_STATUS (err u101))
(define-constant ERR_LISTING_NOT_FOUND (err u102))
(define-constant ERR_OFFER_NOT_FOUND (err u103))
(define-constant ERR_ALREADY_COMPLETED (err u104))
(define-constant ERR_INVALID_ITEM_ID (err u105))
(define-constant ERR_HISTORY_OVERFLOW (err u106))
(define-constant ERR_INVALID_DESCRIPTION (err u107))

;; Status Constants
(define-constant STATUS_ACTIVE "active")
(define-constant STATUS_CANCELLED "cancelled")
(define-constant STATUS_COMPLETED "completed")
(define-constant STATUS_PENDING "pending")
(define-constant STATUS_REJECTED "rejected")

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

;; Private Functions

;; Validate description length and content
(define-private (validate-description (description (string-ascii 256)))
    (if (> (len description) u0)
        (ok true)
        ERR_INVALID_DESCRIPTION))

;; Optimized trade history management
(define-private (add-trade-to-history (user principal) (listing-id uint))
    (let
        (
            (current-history (default-to (list) (map-get? UserTrades user)))
        )
        (ok (map-set UserTrades 
            user 
            (unwrap! 
                (as-max-len? 
                    (concat 
                        (list listing-id)
                        (slice? current-history u0 u49)
                    )
                    u50
                )
                ERR_HISTORY_OVERFLOW
            )
        ))
    )
)

;; Validate item ID exists
(define-private (validate-item-id (item-id uint))
    (if (> item-id u0)
        (ok true)
        ERR_INVALID_ITEM_ID))

;; Public Functions

;; Create a new listing
(define-public (create-listing (item-id uint) (description (string-ascii 256)))
    (begin
        (try! (validate-item-id item-id))
        (try! (validate-description description))
        (let
            (
                (listing-id (var-get next-listing-id))
            )
            (map-set Listings listing-id {
                owner: tx-sender,
                item-id: item-id,
                description: description,
                status: STATUS_ACTIVE
            })
            (var-set next-listing-id (+ listing-id u1))
            (ok listing-id)
        )
    )
)

[... Rest of the contract remains unchanged ...]
